import { ArrowRight, RefreshCw, Sparkles, Quote } from 'lucide-react';
import type { TopicRecord } from '../types';
import { Spinner } from './Spinner';

interface TopicCardProps {
  topic: TopicRecord | null;
  loading?: boolean;
  regenerating?: boolean;
  compact?: boolean;
  onRegenerate?: () => void;
  onStart?: () => void;
}

export function TopicCard({
  topic,
  loading,
  regenerating,
  compact,
  onRegenerate,
  onStart,
}: TopicCardProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="bg-brand-soft px-5 pb-6 pt-5">
          <div className="h-5 w-24 animate-pulse rounded-full bg-black/5 dark:bg-white/10" />
          <div className="mt-5 h-7 w-4/5 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-black/5 dark:bg-white/10" />
        </div>
        <div className="space-y-2 px-5 py-5">
          <div className="h-3.5 w-full animate-pulse rounded bg-black/5 dark:bg-white/10" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-black/5 dark:bg-white/10" />
          <p className="pt-2 text-[12px] text-muted">正在为你准备今天的话题…</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface px-5 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">今天还没有话题</p>
        <p className="mt-1.5 text-[12.5px] text-muted">检查网络或 API Key 后重新生成。</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 sticky-radius border border-line bg-surface px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-[16px] leading-tight text-ink">{topic.title_en}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">
            {topic.title_zh} · {topic.scene_en}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <div className="relative overflow-hidden bg-brand-soft px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand dark:bg-white/10">
            <Sparkles className="size-3" />
            今日话题
          </span>
          {topic.source === 'fallback' && (
            <span className="text-[10px] text-muted">内置话题</span>
          )}
        </div>
        <p className="relative mt-4 text-[10px] uppercase tracking-[0.18em] text-muted">
          {topic.scene_en}
        </p>
        <h2 className="relative mt-1.5 font-serif text-[27px] leading-[1.18] text-ink text-balance">
          {topic.title_en}
        </h2>
        <p className="relative mt-1.5 text-[12.5px] text-muted">{topic.title_zh}</p>
      </div>

      <div className="px-5 pb-5 pt-4">
        <p className="text-[13.5px] leading-6 text-ink">{topic.prompt_zh}</p>

        {topic.icebreaker_en && (
          <div className="mt-4 rounded-2xl bg-surface2 px-3.5 py-3">
            <div className="flex gap-2">
              <Quote className="mt-0.5 size-3.5 shrink-0 text-brand" />
              <p className="font-serif text-[14px] italic leading-6 text-ink">
                {topic.icebreaker_en}
              </p>
            </div>
            <p className="mt-1 pl-[22px] text-[11px] text-muted">AI 会用这句话开启对话</p>
          </div>
        )}

        {(onStart || onRegenerate) && (
          <div className="mt-5 flex gap-2.5">
            {onStart && (
              <button
                type="button"
                onClick={onStart}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-[14px] font-semibold text-white shadow-float transition active:scale-[0.98] active:bg-brand-strong dark:text-[#1a1830]"
              >
                开始练习
                <ArrowRight className="size-4" />
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={regenerating}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface px-3.5 text-[13px] font-medium text-muted transition active:bg-surface2 disabled:opacity-50"
              >
                {regenerating ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
                换一个
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
