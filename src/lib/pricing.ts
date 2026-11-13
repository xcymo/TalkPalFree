import type { UsageRecord } from '../types';

interface PriceTable {
  llmInputPerM: number;
  llmCachedInputPerM: number;
  llmOutputPerM: number;
  asrPerHour: number;
  /** TTS 目前限时免费；若以后收费，在这里填入每百万字符价格 */
  ttsPerMChars: number;
}

/** 官方按量计费国内价格（2026-10-21 版），单位：每百万 tokens / 每小时 / 每百万字符。 */
const PRICES: PriceTable = {
  llmInputPerM: 1,
  llmCachedInputPerM: 0.02,
  llmOutputPerM: 2,
  asrPerHour: 0.5,
  ttsPerMChars: 0,
};

export interface UsageCost {
  llm: number;
  asr: number;
  tts: number;
  total: number;
  /** 使用了旧版用量记录，费用是按总量/请求次数折算的 */
  estimatedLegacy: boolean;
}

export function formatMoney(amount: number): string {
  const value = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (value === 0) return '¥0.00';
  const digits = value >= 1 ? 2 : value >= 0.01 ? 3 : 4;
  return `¥${value.toFixed(digits)}`;
}

export function formatSeconds(totalSeconds: number): string {
  const value = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  if (value < 60) return `${Math.round(value)} 秒`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes} 分 ${seconds} 秒`;
}

/**
 * 按官方国内价格估算三个模型的费用。
 * 旧版本没有记录输入/输出拆分和音频时长，会退化为按总量折算，并在 UI 中标注。
 */
export function calculateUsageCost(usage: UsageRecord): UsageCost {
  const input = Math.max(0, usage.llmInputTokens || 0);
  const cached = Math.min(input, Math.max(0, usage.llmCachedInputTokens || 0));
  const output = Math.max(0, usage.llmOutputTokens || 0);

  let uncachedInput = input - cached;
  let outputTokens = output;
  let legacyLlm = false;

  if (input + output === 0 && usage.llmTokens > 0) {
    // 旧记录只有总数，没有输入/输出拆分：按 80% 输入、20% 输出估算
    uncachedInput = usage.llmTokens * 0.8;
    outputTokens = usage.llmTokens * 0.2;
    legacyLlm = true;
  }

  const llm =
    (uncachedInput / 1_000_000) * PRICES.llmInputPerM +
    (cached / 1_000_000) * PRICES.llmCachedInputPerM +
    (outputTokens / 1_000_000) * PRICES.llmOutputPerM;

  // 旧 ASR 记录只有请求次数，没有音频时长：按每次 15 秒估算
  const legacyAsr = usage.asrSeconds === 0 && usage.asrRequests > 0;
  const asrSeconds = legacyAsr ? usage.asrRequests * 15 : usage.asrSeconds;
  const asr = (asrSeconds / 3600) * PRICES.asrPerHour;
  const tts = (usage.ttsChars / 1_000_000) * PRICES.ttsPerMChars;

  return {
    llm,
    asr,
    tts,
    total: llm + asr + tts,
    estimatedLegacy: legacyLlm || legacyAsr,
  };
}
