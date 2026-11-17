import { generateCustomTopic, generateTopicBatch } from './api';
import {
  db,
  getTodayTopic,
  getTopicQueue,
  saveTodayTopic,
  saveTopicQueue,
} from './db';
import { pickRandomPoolItems, TOPIC_POOL } from '../data/topics';
import { toDateKey } from './utils';
import type { TopicDraft, TopicRecord } from '../types';

export interface TopicResult {
  topic: TopicRecord;
  warning?: string;
}

const RECENT_TOPIC_LIMIT = 60;
const BATCH_SIZE = 8;
const PREFILL_THRESHOLD = 2;
const POOL_FALLBACK_WINDOW = 14;

const inflight = new Map<string, Promise<TopicResult>>();
let refillPromise: Promise<void> | null = null;
let queueLock: Promise<unknown> = Promise.resolve();

/** Serialize queue reads/writes so a background refill cannot race a consume. */
function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = queueLock.then(fn, fn);
  queueLock = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function recentTopics(limit = RECENT_TOPIC_LIMIT): Promise<TopicRecord[]> {
  const topics = await db.topics.orderBy('createdAt').toArray();
  return topics.slice(-limit);
}

function describeTopic(topic: { title_en: string; scene_en: string; tags?: string[] }): string {
  const base = `${topic.title_en} — ${topic.scene_en}`;
  return topic.tags?.length ? `${base} — ${topic.tags.join(', ')}` : base;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

const GENERIC_TAGS = new Set([
  'conversation',
  'english',
  'speaking',
  'practice',
  'language',
  'roleplay',
  'role-play',
  'dialogue',
  'chat',
]);

function tagsOf(topic: { tags?: string[] }): string[] {
  return Array.from(
    new Set(
      (topic.tags ?? [])
        .map(normalize)
        .filter((tag) => Boolean(tag) && !GENERIC_TAGS.has(tag)),
    ),
  );
}

function isTooSimilar(
  draft: TopicDraft,
  other: { title_en: string; scene_en: string; tags?: string[] },
): boolean {
  if (normalize(draft.title_en) === normalize(other.title_en)) return true;
  if (normalize(draft.scene_en) === normalize(other.scene_en)) return true;
  const otherTags = new Set(tagsOf(other));
  let shared = 0;
  for (const tag of tagsOf(draft)) {
    if (otherTags.has(tag)) shared += 1;
    if (shared >= 2) return true;
  }
  return false;
}

function filterBatch(
  drafts: TopicDraft[],
  avoid: Array<{ title_en: string; scene_en: string; tags?: string[] }>,
): TopicDraft[] {
  const accepted: TopicDraft[] = [];
  for (const draft of drafts) {
    if (avoid.some((item) => isTooSimilar(draft, item))) continue;
    if (accepted.some((item) => isTooSimilar(draft, item))) continue;
    accepted.push(draft);
  }
  return accepted;
}

/** Generate a batch in the background and append to the queue. */
async function refillQueue(apiKey: string): Promise<void> {
  if (!apiKey.trim()) return;
  if (refillPromise) return refillPromise;

  refillPromise = (async () => {
    try {
      const recent = await recentTopics();
      const queue = await getTopicQueue();
      const drafts = await generateTopicBatch(
        apiKey,
        recent.map(describeTopic),
        queue.map(describeTopic),
        BATCH_SIZE,
      );
      const valid = filterBatch(drafts, [...recent, ...queue]);
      if (!valid.length) return;

      const queuedAt = Date.now();
      await withQueueLock(async () => {
        const current = await getTopicQueue();
        await saveTopicQueue([
          ...current,
          ...valid.map((draft) => ({ ...draft, queuedAt })),
        ]);
      });
    } catch {
      // 预生成失败不影响当天话题，下次打开会再次尝试
    } finally {
      refillPromise = null;
    }
  })();

  return refillPromise;
}

/** Keep a buffer in the queue so the next days need no LLM wait. */
function maybePrefillQueue(apiKey: string): void {
  if (!apiKey.trim()) return;
  void (async () => {
    const queue = await getTopicQueue();
    if (queue.length <= PREFILL_THRESHOLD) {
      await refillQueue(apiKey);
    }
  })();
}

async function consumeQueuedTopic(dateKey: string): Promise<TopicRecord | null> {
  return withQueueLock(async () => {
    const queue = await getTopicQueue();
    const next = queue[0];
    if (!next) return null;

    await saveTopicQueue(queue.slice(1));
    const record: TopicRecord = {
      dateKey,
      scene_en: next.scene_en,
      title_en: next.title_en,
      title_zh: next.title_zh,
      prompt_zh: next.prompt_zh,
      icebreaker_en: next.icebreaker_en,
      icebreaker_zh: next.icebreaker_zh,
      icebreaker_role: next.icebreaker_role,
      tags: next.tags,
      poolId: 'ai',
      source: 'llm',
      createdAt: Date.now(),
    };
    await saveTodayTopic(record);
    return record;
  });
}

async function fallbackTodayTopic(
  dateKey: string,
  current?: TopicRecord | null,
): Promise<TopicRecord> {
  const recent = await recentTopics(POOL_FALLBACK_WINDOW);
  const recentPoolIds = new Set(
    recent
      .map((topic) => topic.poolId)
      .filter(
        (id): id is string =>
          Boolean(id) && TOPIC_POOL.some((item) => item.id === id),
      ),
  );
  if (current && TOPIC_POOL.some((item) => item.id === current.poolId)) {
    recentPoolIds.add(current.poolId);
  }

  const candidates = pickRandomPoolItems(6, Array.from(recentPoolIds));
  const item = candidates[0] ?? TOPIC_POOL[0];
  const record: TopicRecord = {
    dateKey,
    scene_en: item.scene,
    title_en: item.titleEn,
    title_zh: item.titleZh,
    prompt_zh: item.promptZh,
    icebreaker_en: item.icebreakerEn,
    icebreaker_zh: item.icebreakerZh,
    icebreaker_role: 'learner',
    poolId: item.id,
    source: 'fallback',
    createdAt: Date.now(),
  };
  await saveTodayTopic(record);
  return record;
}

/** 每天首次打开时取一个话题：优先从队列消费，队列空时再生成。 */
export async function ensureTodayTopic(apiKey: string): Promise<TopicResult> {
  const dateKey = toDateKey();
  const existing = await getTodayTopic(dateKey);
  if (existing) {
    maybePrefillQueue(apiKey);
    return { topic: existing };
  }

  const pending = inflight.get(dateKey);
  if (pending) return pending;

  const promise = (async (): Promise<TopicResult> => {
    if (!apiKey.trim()) {
      return {
        topic: await fallbackTodayTopic(dateKey),
        warning: '未填写 API Key，先使用内置话题。填写后可让 AI 生成更贴合的话题。',
      };
    }

    const consumed = await consumeQueuedTopic(dateKey);
    if (consumed) {
      maybePrefillQueue(apiKey);
      return { topic: consumed };
    }

    await refillQueue(apiKey);
    const retried = await consumeQueuedTopic(dateKey);
    if (retried) {
      maybePrefillQueue(apiKey);
      return { topic: retried };
    }

    return {
      topic: await fallbackTodayTopic(dateKey),
      warning: 'AI 话题生成失败，先使用内置话题，稍后可以在「换一个」重试。',
    };
  })().finally(() => {
    inflight.delete(dateKey);
  });

  inflight.set(dateKey, promise);
  return promise;
}

/** 「换一个」：直接消费队列里的下一个话题；没有队列时才生成。 */
export async function regenerateTodayTopic(
  apiKey: string,
  current?: TopicRecord | null,
): Promise<TopicResult> {
  const dateKey = toDateKey();

  if (!apiKey.trim()) {
    return {
      topic: await fallbackTodayTopic(dateKey, current),
      warning: '未填写 API Key，先使用内置话题。填写后可让 AI 生成更贴合的话题。',
    };
  }

  const consumed = await consumeQueuedTopic(dateKey);
  if (consumed) {
    maybePrefillQueue(apiKey);
    return { topic: consumed };
  }

  await refillQueue(apiKey);
  const retried = await consumeQueuedTopic(dateKey);
  if (retried) {
    maybePrefillQueue(apiKey);
    return { topic: retried };
  }

  return {
    topic: await fallbackTodayTopic(dateKey, current),
    warning: 'AI 话题生成失败，已使用内置话题。',
  };
}

/** 根据用户输入的关键词生成今天的话题；失败时抛错，不回退到内置话题。 */
export async function generateCustomTodayTopic(
  apiKey: string,
  keyword: string,
  current?: TopicRecord | null,
): Promise<TopicResult> {
  const dateKey = toDateKey();
  const recent = await recentTopics();
  const used = [...recent, ...(current ? [current] : [])]
    .map(describeTopic)
    .slice(-RECENT_TOPIC_LIMIT);

  const topic = await generateCustomTopic(apiKey, keyword, used);

  const record: TopicRecord = {
    dateKey,
    ...topic,
    poolId: 'custom',
    source: 'llm',
    createdAt: Date.now(),
  };
  await saveTodayTopic(record);
  maybePrefillQueue(apiKey);
  return { topic: record };
}
