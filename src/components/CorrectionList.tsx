import { ArrowRight, Check, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Correction } from '../types';
import { CORRECTION_TYPE_META } from '../config/models';

export function CorrectionList({ corrections }: { corrections: Correction[] }) {
  if (corrections.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3.5 dark:border-emerald-400/20 dark:bg-emerald-400/[0.08]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-[13.5px] font-medium text-ink">这句话很自然，没有需要修改的地方</p>
          <p className="mt-0.5 text-[11.5px] text-muted">继续保持，试着把句子说得更长一点。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {corrections.map((correction, index) => {
        const meta = CORRECTION_TYPE_META[correction.type] ?? CORRECTION_TYPE_META.other;
        return (
          <article
            key={`${correction.original}-${index}`}
            className={`rounded-2xl border px-4 py-3.5 ${meta.card}`}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${meta.chip}`}>
                {meta.label}
              </span>
              <span className="text-[10.5px] text-muted">#{index + 1}</span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px]">
              <span className="text-muted line-through decoration-muted">
                {correction.original}
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-muted" />
              <span className="font-medium leading-6 text-ink">{correction.corrected}</span>
            </div>

            <p className="mt-2 text-[12.5px] leading-5 text-muted">{correction.reason_zh}</p>
          </article>
        );
      })}
    </div>
  );
}

export function ResultSectionTitle({ icon: Icon = Sparkles, children }: { icon?: typeof Sparkles; children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}
