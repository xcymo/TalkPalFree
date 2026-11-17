import { Pause, Play, Sparkles } from 'lucide-react';
import { useTtsPlayer } from '../hooks/useTts';
import { Spinner } from './Spinner';

interface OpeningHintProps {
  text: string;
  translation?: string;
  voice: string;
}

/** 给用户的开场提示：不是聊天消息，也不会进入 LLM 历史。 */
export function OpeningHint({ text, translation, voice }: OpeningHintProps) {
  const { status, error, toggle } = useTtsPlayer();
  const loading = status === 'loading';
  const playing = status === 'playing';

  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white dark:text-[#1a1830]">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            开场提示 · 你可以这样说
          </p>
          <p className="mt-1.5 font-serif text-[16px] leading-7 text-ink">{text}</p>
          {translation && (
            <p className="mt-1.5 text-[12px] leading-5 text-muted">{translation}</p>
          )}
          {error && <p className="mt-1.5 text-[11px] text-rose-500">{error}</p>}
        </div>
        <button
          type="button"
          onClick={() => void toggle(text, voice)}
          disabled={loading}
          aria-label={playing ? '暂停播放开场提示' : '播放开场提示'}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-brand transition active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <Spinner className="size-4" />
          ) : playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4 translate-x-[1px] fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
