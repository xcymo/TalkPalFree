import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Volume2 } from 'lucide-react';
import { VOICES, getVoice } from '../config/voices';
import { classNames } from '../lib/utils';

interface VoiceSelectProps {
  value: string;
  onChange: (voiceId: string) => void;
}

const GROUPS = [
  { label: '英文音色', items: VOICES.filter((voice) => voice.language === 'en') },
  { label: '中文音色', items: VOICES.filter((voice) => voice.language === 'zh') },
];

export function VoiceSelect({ value, onChange }: VoiceSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = getVoice(value);

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
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-line bg-surface2 px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft active:bg-surface"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Volume2 className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[13.5px] font-semibold text-ink">{selected.name}</span>
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-medium text-muted">
              {selected.language === 'en' ? 'EN' : '中文'}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted">
            {selected.description}
          </span>
        </span>
        <ChevronDown
          className={classNames(
            'size-4 shrink-0 text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-float animate-fade-up">
          <div role="listbox" aria-label="选择语音音色" className="max-h-[286px] overflow-y-auto no-scrollbar">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2.5 pb-1 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {group.label}
                </p>
                {group.items.map((voice) => {
                  const active = voice.id === value;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(voice.id);
                        setOpen(false);
                      }}
                      className={classNames(
                        'flex min-h-[48px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                        active ? 'bg-brand-soft' : 'active:bg-surface2',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={classNames(
                            'block text-[13px]',
                            active ? 'font-semibold text-brand' : 'font-medium text-ink',
                          )}
                        >
                          {voice.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                          {voice.description}
                        </span>
                      </span>
                      {active ? (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-white dark:text-[#1a1830]">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="size-5 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
