import { Sparkles } from 'lucide-react';
import { classNames } from '../lib/utils';

interface SentenceCompareProps {
  userText: string;
  optimizedSentence: string;
  compact?: boolean;
}

/** 原句和 AI 优化句用两块明显不同的样式展示，避免看起来一模一样。 */
export function SentenceCompare({ userText, optimizedSentence, compact }: SentenceCompareProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className={compact ? 'px-3.5 py-3' : 'px-4 py-3.5'}>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          你说的话
        </p>
        <p
          className={classNames(
            'mt-1.5 text-ink',
            compact ? 'text-[13.5px] leading-6' : 'text-[15px] leading-7',
          )}
        >
          {userText}
        </p>
      </div>

      <div
        className={classNames(
          'border-t border-line bg-brand-soft',
          compact ? 'px-3.5 py-3' : 'px-4 py-3',
        )}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          <Sparkles className="size-3" />
          更自然的说法
        </p>
        <p
          className={classNames(
            'mt-1.5 font-serif font-medium text-ink',
            compact ? 'text-[14.5px] leading-6' : 'text-[16px] leading-7',
          )}
        >
          {optimizedSentence}
        </p>
      </div>
    </div>
  );
}
