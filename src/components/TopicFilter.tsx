import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { classNames } from '../lib/utils';

export interface TopicFilterOption {
  title: string;
  count: number;
}

interface TopicFilterProps {
  value: string;
  options: TopicFilterOption[];
  onChange: (value: string) => void;
}

export function TopicFilter({ value, options, onChange }: TopicFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedCount =
    value === 'all'
      ? null
      : (options.find((option) => option.title === value)?.count ?? null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="按话题筛选"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[48px] w-full items-center gap-2.5 sticky-radius sticky-border sticky-surface border px-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft active:bg-surface2"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Filter className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
          {value === 'all' ? '全部话题' : value}
        </span>
        {selectedCount !== null && (
          <span className="shrink-0 rounded-full bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
            {selectedCount} 轮
          </span>
        )}
        <ChevronDown
          className={classNames(
            'size-4 shrink-0 text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-float animate-fade-up">
          <div role="listbox" aria-label="按话题筛选" className="max-h-[264px] overflow-y-auto no-scrollbar">
            <TopicOption
              label="全部话题"
              active={value === 'all'}
              onClick={() => {
                onChange('all');
                setOpen(false);
              }}
            />
            {options.map((option) => (
              <TopicOption
                key={option.title}
                label={option.title}
                count={option.count}
                active={value === option.title}
                onClick={() => {
                  onChange(option.title);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicOption({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={classNames(
        'flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition',
        active ? 'bg-brand-soft' : 'active:bg-surface2',
      )}
    >
      <span
        className={classNames(
          'min-w-0 flex-1 truncate text-[12.5px]',
          active ? 'font-semibold text-brand' : 'font-medium text-ink',
        )}
      >
        {label}
      </span>
      {typeof count === 'number' && (
        <span className="shrink-0 text-[10px] text-muted">{count} 轮</span>
      )}
      {active ? (
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand text-white dark:text-[#1a1830]">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : (
        <span className="size-4 shrink-0" />
      )}
    </button>
  );
}
