import { useEffect, useRef, useState } from 'react';
import { Languages, Pause, Play, Volume2 } from 'lucide-react';
import { useTtsPlayer } from '../hooks/useTts';
import { useSettings } from '../hooks/useSettings';
import { getVoice } from '../config/voices';
import { classNames } from '../lib/utils';
import { Spinner } from './Spinner';

interface ReplyCardProps {
  text: string;
  translation?: string;
  voice: string;
  autoPlay?: boolean;
  compact?: boolean;
  label?: string;
  onAutoPlayed?: () => void;
  hideAvatar?: boolean;
  collapsibleTranslation?: boolean;
}

export function ReplyCard({
  text,
  translation,
  voice,
  autoPlay,
  compact,
  label = 'AI 回复',
  onAutoPlayed,
  hideAvatar,
  collapsibleTranslation,
}: ReplyCardProps) {
  const { status, error, toggle } = useTtsPlayer();
  const { settings } = useSettings();
  const autoPlayedRef = useRef(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const voiceInfo = getVoice(voice);

  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current) return;
    if (!settings.autoPlay) {
      onAutoPlayed?.();
      return;
    }
    const timer = window.setTimeout(() => {
      autoPlayedRef.current = true;
      onAutoPlayed?.();
      void toggle(text, voice);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [autoPlay, settings.autoPlay, text, voice, toggle, onAutoPlayed]);

  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';

  return (
    <div
      className={classNames(
        'rounded-2xl border border-line bg-surface',
        compact ? 'px-4 py-3.5' : 'px-4 py-4',
      )}
    >
      <div className="flex items-stretch gap-3">
        {!hideAvatar && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Volume2 className="size-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">{label}</span>
            <span className="text-[10px] text-muted">· {voiceInfo.name}</span>
          </div>
          <p
            className={classNames(
              'mt-1.5 font-serif leading-7 text-ink',
              compact ? 'text-[15px]' : 'text-[16.5px]',
            )}
          >
            {text}
          </p>
          {translation && !collapsibleTranslation && (
            <p className="mt-2 border-t border-line pt-2 text-[12.5px] leading-5 text-muted">
              {translation}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void toggle(text, voice)}
            disabled={isLoading}
            aria-label={isPlaying ? '暂停播放' : '播放 AI 回复'}
            className={classNames(
              'flex size-11 shrink-0 items-center justify-center rounded-full transition active:scale-95',
              isPlaying
                ? 'bg-brand text-white dark:text-[#1a1830]'
                : 'bg-surface2 text-brand active:bg-brand-soft',
            )}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 translate-x-[1px] fill-current" />
            )}
          </button>

          {translation && collapsibleTranslation && (
            <button
              type="button"
              onClick={() => setTranslationOpen((value) => !value)}
              aria-expanded={translationOpen}
              aria-label={translationOpen ? '收起翻译' : '展开翻译'}
              className={classNames(
                'flex size-6 shrink-0 items-center justify-center rounded-full transition active:scale-95',
                translationOpen ? 'text-brand' : 'text-muted active:text-brand',
              )}
            >
              <Languages className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {translation && collapsibleTranslation && translationOpen && (
        <p className="mt-2 border-t border-line pt-2 text-[12.5px] leading-5 text-muted animate-fade-up">
          {translation}
        </p>
      )}

      {error && (
        <p
          className={classNames(
            'mt-2 text-[11.5px] leading-5 text-rose-500',
            !hideAvatar && 'pl-11',
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
}
