import type { CorrectionType } from '../types';

export const API_BASE_URL = 'https://api.xiaomimimo.com/v1';

export const MODELS = {
  asr: 'mimo-v2.5-asr',
  llm: 'mimo-v2.6-flash',
  tts: 'mimo-v2.5-tts',
} as const;

export const RECORDING = {
  maxSeconds: 60,
  minSeconds: 0.6,
} as const;

export const CORRECTION_TYPE_META: Record<
  CorrectionType,
  { label: string; chip: string; card: string; dot: string }
> = {
  grammar: {
    label: '语法',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    card: 'border-sky-200/80 bg-sky-50/60 dark:border-sky-400/20 dark:bg-sky-400/[0.06]',
    dot: 'bg-sky-400',
  },
  word_choice: {
    label: '用词',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
    card: 'border-violet-200/80 bg-violet-50/60 dark:border-violet-400/20 dark:bg-violet-400/[0.06]',
    dot: 'bg-violet-400',
  },
  collocation: {
    label: '搭配',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    card: 'border-amber-200/80 bg-amber-50/60 dark:border-amber-400/20 dark:bg-amber-400/[0.06]',
    dot: 'bg-amber-400',
  },
  other: {
    label: '表达',
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
    card: 'border-teal-200/80 bg-teal-50/60 dark:border-teal-400/20 dark:bg-teal-400/[0.06]',
    dot: 'bg-teal-400',
  },
};
