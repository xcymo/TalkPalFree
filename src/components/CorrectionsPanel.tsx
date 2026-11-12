import { useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import type { Correction } from '../types';
import { CorrectionList } from './CorrectionList';
import { classNames } from '../lib/utils';

interface CorrectionsPanelProps {
  corrections: Correction[];
  compact?: boolean;
}

/** 纠错默认收起，点开才展开，避免一次结果拉得特别长。 */
export function CorrectionsPanel({ corrections, compact }: CorrectionsPanelProps) {
  const [open, setOpen] = useState(false);

  if (corrections.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-3.5 py-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/[0.08]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
          <Check className="size-3.5" />
        </span>
        <p className="text-[12px] text-ink">这句话很自然，没有需要修改的地方</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={classNames(
          'flex w-full items-center gap-2.5 px-3.5 text-left transition active:bg-surface2',
          compact ? 'min-h-[46px]' : 'min-h-[50px]',
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Sparkles className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-ink">AI 纠错</span>
          <span className="mt-0.5 block text-[10px] text-muted">
            {open ? '点击收起' : '点击查看具体修改'}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {corrections.length} 处
        </span>
        <ChevronDown
          className={classNames(
            'size-4 shrink-0 text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-line px-3 py-3 animate-fade-up">
          <CorrectionList corrections={corrections} />
        </div>
      )}
    </div>
  );
}
