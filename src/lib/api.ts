import { API_BASE_URL, MODELS } from '../config/models';
import { pickRandomPoolItems, type TopicPoolItem } from '../data/topics';
import type { Correction, CorrectionResult, CorrectionType, TopicDraft } from '../types';
import { blobToBase64, base64ToBlob } from './audio';
import { getTtsBlob, putTtsBlob, trackUsage } from './db';
import {
  CUSTOM_TOPIC_SYSTEM_PROMPT,
  TOPIC_SYSTEM_PROMPT,
  TTS_STYLE_INSTRUCTION,
  buildCorrectionSystemPrompt,
  buildCorrectionUserPrompt,
  buildCustomTopicUserPrompt,
  buildTopicUserPrompt,
} from './schemas';
import { ttsCacheKey } from './utils';

export class ApiError extends Error {
  readonly friendly: string;
  readonly status?: number;

  constructor(message: string, friendly?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.friendly = friendly ?? message;
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.friendly;
  if (error instanceof Error && error.message) return error.message;
  return '出了点问题，请稍后重试。';
}

type Json = Record<string, unknown>;

async function chatRequest(
  apiKey: string,
  body: Json,
  timeoutMs = 60_000,
): Promise<Json> {
  if (!apiKey.trim()) {
    throw new ApiError('missing api key', '还没有填写 MiMo API Key，请先到「设置」页填写。');
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: Json | null = null;
    try {
      data = raw ? (JSON.parse(raw) as Json) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw httpError(response.status, data, raw);
    }
    if (!data) {
      throw new ApiError('empty response', 'MiMo 返回了空响应，请稍后重试。', response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('timeout', '请求超时了，请检查网络后重试。');
    }
    throw new ApiError('network error', '网络连接失败，请检查网络或稍后重试。');
  } finally {
    window.clearTimeout(timer);
  }
}

function httpError(status: number, data: Json | null, raw: string): ApiError {
  const errorObject = (data?.error ?? {}) as { message?: string; code?: string };
  const serverMessage =
    errorObject.message ??
    (typeof data?.message === 'string' ? data.message : undefined) ??
    raw.slice(0, 160);

  let friendly: string;
  if (status === 401 || status === 403) {
    friendly = 'API Key 无效或没有访问权限，请到「设置」页检查 Key 是否填写正确。';
  } else if (status === 402) {
    friendly = 'MiMo 账户余额不足，请到官网充值后再试。';
  } else if (status === 429) {
    friendly = '请求太频繁或额度已用完，稍等一会儿再试。';
  } else if (status === 404) {
    friendly = '接口或模型暂时不可用（可能是模型名称变更），请稍后重试。';
  } else if (status >= 500) {
    friendly = 'MiMo 服务暂时不可用，请稍后重试。';
  } else {
    friendly = `请求失败（${status}）${serverMessage ? `：${serverMessage}` : ''}`;
  }

  return new ApiError(serverMessage || `HTTP ${status}`, friendly, status);
}

function extractMessageText(data: Json): string {
  const choices = data.choices as Array<{ message?: { content?: unknown } }> | undefined;
  const content = choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('')
      .trim();
  }
  return '';
}

export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new ApiError('invalid json', 'AI 返回的内容格式异常，请再试一次。');
  }
}

export async function transcribeAudio(apiKey: string, wavBlob: Blob): Promise<string> {
  const base64 = await blobToBase64(wavBlob);
  const data = await chatRequest(
    apiKey,
    {
      model: MODELS.asr,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: { data: `data:audio/wav;base64,${base64}` },
            },
          ],
        },
      ],
      asr_options: { language: 'en' },
    },
    60_000,
  );

  const text = extractMessageText(data).trim();
  if (!text) {
    throw new ApiError('empty asr result', '没有听清这次录音，请靠近麦克风再说一次。');
  }
  await trackUsage({ asrRequests: 1 });
  return text;
}

const VALID_TYPES: CorrectionType[] = ['grammar', 'word_choice', 'collocation', 'other'];

function normalizeCorrections(value: unknown): Correction[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .map((item) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      const original = typeof raw.original === 'string' ? raw.original.trim() : '';
      const corrected = typeof raw.corrected === 'string' ? raw.corrected.trim() : '';
      const reason = typeof raw.reason_zh === 'string' ? raw.reason_zh.trim() : '';
      const type = VALID_TYPES.includes(raw.type as CorrectionType)
        ? (raw.type as CorrectionType)
        : 'other';
      if (!original || !corrected) return null;
      return { original, corrected, reason_zh: reason, type } satisfies Correction;
    })
    .filter((item): item is Correction => item !== null);
}

export interface CorrectionRequest {
  apiKey: string;
  topic: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  utterance: string;
}

/** 每次纠错请求最多带上的历史消息条数（一问一答算两条）。 */
const HISTORY_MESSAGE_LIMIT = 16;

export async function correctAndReply({
  apiKey,
  topic,
  history,
  utterance,
}: CorrectionRequest): Promise<CorrectionResult> {
  const data = await chatRequest(
    apiKey,
    {
      model: MODELS.llm,
      messages: [
        { role: 'system', content: buildCorrectionSystemPrompt(topic) },
        ...history.slice(-HISTORY_MESSAGE_LIMIT).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: 'user',
          content: buildCorrectionUserPrompt({ utterance }),
        },
      ],
      response_format: { type: 'json_object' },
      // MiMo v2.6 默认开启思考，这里显式关闭以降低延迟和输出截断风险
      thinking: { type: 'disabled' },
      max_completion_tokens: 1800,
    },
    90_000,
  );

  const raw = extractMessageText(data);
  const parsed = parseJsonLoose<Partial<CorrectionResult>>(raw);

  const replyText = typeof parsed.reply_text === 'string' ? parsed.reply_text.trim() : '';
  if (!replyText) {
    throw new ApiError('missing reply', 'AI 返回的回复不完整，请再说一次试试。');
  }

  const usage = data.usage as { total_tokens?: number } | undefined;
  await trackUsage({ llmTokens: usage?.total_tokens ?? 0 });

  return {
    corrections: normalizeCorrections(parsed.corrections),
    optimized_full_sentence:
      typeof parsed.optimized_full_sentence === 'string'
        ? parsed.optimized_full_sentence.trim()
        : utterance,
    reply_text: replyText,
    reply_translation_zh:
      typeof parsed.reply_translation_zh === 'string'
        ? parsed.reply_translation_zh.trim()
        : undefined,
  };
}

export interface GeneratedTopic {
  topic: TopicDraft;
  poolId: string;
  source: 'llm' | 'fallback';
  warning?: string;
}

function fallbackTopic(item: TopicPoolItem): GeneratedTopic {
  return {
    source: 'fallback',
    poolId: item.id,
    topic: {
      scene_en: item.scene,
      title_en: item.titleEn,
      title_zh: item.titleZh,
      prompt_zh: item.promptZh,
      icebreaker_en: item.icebreakerEn,
      icebreaker_zh: item.icebreakerZh,
    },
  };
}

export async function generateDailyTopic(
  apiKey: string,
  usedTitles: string[] = [],
  excludePoolIds: string[] = [],
): Promise<GeneratedTopic> {
  const candidates = pickRandomPoolItems(6, excludePoolIds);

  if (!apiKey.trim()) {
    return {
      ...fallbackTopic(candidates[0]),
      warning: '未填写 API Key，先使用内置话题。填写后可让 AI 生成更贴合的话题。',
    };
  }

  try {
    const data = await chatRequest(
      apiKey,
      {
        model: MODELS.llm,
        messages: [
          { role: 'system', content: TOPIC_SYSTEM_PROMPT },
          { role: 'user', content: buildTopicUserPrompt(candidates, usedTitles.slice(-8)) },
        ],
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
        max_completion_tokens: 700,
      },
      60_000,
    );

    const parsed = parseJsonLoose<Partial<TopicDraft>>(extractMessageText(data));
    if (!parsed.title_en || !parsed.title_zh || !parsed.prompt_zh) {
      throw new ApiError('invalid topic', '话题生成结果不完整');
    }

    const matched =
      candidates.find((item) => item.scene.toLowerCase() === String(parsed.scene_en ?? '').toLowerCase()) ??
      candidates.find((item) =>
        String(parsed.scene_en ?? '')
          .toLowerCase()
          .includes(item.scene.split(' ')[0].toLowerCase()),
      ) ??
      candidates[0];

    const usage = data.usage as { total_tokens?: number } | undefined;
    await trackUsage({ llmTokens: usage?.total_tokens ?? 0 });

    return {
      source: 'llm',
      poolId: matched.id,
      topic: {
        scene_en: parsed.scene_en?.trim() || matched.scene,
        title_en: parsed.title_en.trim(),
        title_zh: parsed.title_zh.trim(),
        prompt_zh: parsed.prompt_zh.trim(),
        icebreaker_en: parsed.icebreaker_en?.trim() || matched.icebreakerEn,
        icebreaker_zh: parsed.icebreaker_zh?.trim() || matched.icebreakerZh,
      },
    };
  } catch (error) {
    return {
      ...fallbackTopic(candidates[0]),
      warning: `AI 话题生成失败，已使用内置话题。（${errorMessage(error)}）`,
    };
  }
}

export async function generateCustomTopic(
  apiKey: string,
  keyword: string,
  usedTitles: string[] = [],
): Promise<TopicDraft> {
  const data = await chatRequest(
    apiKey,
    {
      model: MODELS.llm,
      messages: [
        { role: 'system', content: CUSTOM_TOPIC_SYSTEM_PROMPT },
        { role: 'user', content: buildCustomTopicUserPrompt(keyword, usedTitles.slice(-10)) },
      ],
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
      max_completion_tokens: 700,
    },
    60_000,
  );

  const parsed = parseJsonLoose<Partial<TopicDraft>>(extractMessageText(data));
  if (!parsed.title_en || !parsed.title_zh || !parsed.prompt_zh) {
    throw new ApiError('invalid topic', '话题生成结果不完整，请换个关键词再试。');
  }

  const usage = data.usage as { total_tokens?: number } | undefined;
  await trackUsage({ llmTokens: usage?.total_tokens ?? 0 });

  return {
    scene_en: parsed.scene_en?.trim() || keyword.trim(),
    title_en: parsed.title_en.trim(),
    title_zh: parsed.title_zh.trim(),
    prompt_zh: parsed.prompt_zh.trim(),
    icebreaker_en: parsed.icebreaker_en?.trim() || '',
    icebreaker_zh: parsed.icebreaker_zh?.trim() || '',
  };
}

export async function getOrCreateTtsBlob(apiKey: string, text: string, voice: string): Promise<Blob> {  const key = ttsCacheKey(text, voice);
  const cached = await getTtsBlob(key);
  if (cached) return cached;

  const data = await chatRequest(
    apiKey,
    {
      model: MODELS.tts,
      messages: [
        { role: 'user', content: TTS_STYLE_INSTRUCTION },
        { role: 'assistant', content: text },
      ],
      audio: { format: 'mp3', voice },
    },
    90_000,
  );

  const choices = data.choices as
    | Array<{ message?: { audio?: { data?: string } } }>
    | undefined;
  const base64 = choices?.[0]?.message?.audio?.data;
  if (!base64) {
    throw new ApiError('missing audio', 'TTS 没有返回音频，请稍后重试。');
  }

  const blob = base64ToBlob(base64, 'audio/mpeg');
  await putTtsBlob(key, blob, { voice, text });
  await trackUsage({ ttsChars: text.length });
  return blob;
}
