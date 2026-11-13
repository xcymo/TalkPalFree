export type CorrectionType = 'grammar' | 'word_choice' | 'collocation' | 'other';

export interface Correction {
  original: string;
  corrected: string;
  reason_zh: string;
  type: CorrectionType;
}

export interface CorrectionResult {
  corrections: Correction[];
  optimized_full_sentence: string;
  reply_text: string;
  reply_translation_zh?: string;
}

export interface TopicDraft {
  scene_en: string;
  title_en: string;
  title_zh: string;
  prompt_zh: string;
  icebreaker_en: string;
  icebreaker_zh?: string;
}

export interface TopicRecord extends TopicDraft {
  /** Keyed by local date, e.g. 2026-11-12 */
  dateKey: string;
  poolId: string;
  source: 'llm' | 'fallback';
  createdAt: number;
}

export interface SessionRecord {
  id?: number;
  dateKey: string;
  topicId: string;
  topicTitleEn: string;
  topicTitleZh: string;
  userText: string;
  corrections: Correction[];
  optimizedFullSentence: string;
  replyText: string;
  replyTranslationZh?: string;
  ttsCacheKey: string;
  voice: string;
  createdAt: number;
}

export interface AudioCacheRecord {
  key: string;
  blob: Blob;
  voice: string;
  text: string;
  createdAt: number;
}

export interface UsageRecord {
  /** LLM 总 token（兼容旧记录与展示） */
  llmTokens: number;
  llmInputTokens: number;
  llmCachedInputTokens: number;
  llmOutputTokens: number;
  asrRequests: number;
  asrSeconds: number;
  ttsChars: number;
  updatedAt: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  apiKey: string;
  voice: string;
  theme: ThemeMode;
  autoPlay: boolean;
}

export type PracticeStage = 'idle' | 'recording' | 'transcribing' | 'thinking';
