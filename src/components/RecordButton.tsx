import { Loader2, Mic } from 'lucide-react';
import { classNames } from '../lib/utils';

interface RecordButtonProps {
  recording: boolean;
  busy: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ recording, busy, disabled, onStart, onStop }: RecordButtonProps) {
  return (
    <div className="relative flex h-[136px] w-[136px] items-center justify-center">
      {recording && (
        <>
          <span className="absolute inset-0 rounded-full bg-rose-400/25 animate-pulse-ring" />
          <span
            className="absolute inset-0 rounded-full bg-rose-400/20 animate-pulse-ring"
            style={{ animationDelay: '0.6s' }}
          />
        </>
      )}
      <button
        type="button"
        onClick={recording ? onStop : onStart}
        disabled={disabled || busy}
        aria-label={recording ? '结束录音' : '开始录音'}
        className={classNames(
          'relative z-10 flex size-[92px] items-center justify-center rounded-full text-white shadow-float transition active:scale-95',
          recording ? 'bg-rose-500' : 'bg-brand dark:text-[#1a1830] active:bg-brand-strong',
          (disabled || busy) && 'opacity-60',
        )}
      >
        {busy ? (
          <Loader2 className="size-8 animate-spin" />
        ) : recording ? (
          <span className="flex h-9 items-center gap-[3px]">
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="w-[3px] rounded-full bg-white animate-wave"
                style={{
                  height: `${[18, 30, 36, 26, 16][index]}px`,
                  animationDelay: `${index * 0.12}s`,
                }}
              />
            ))}
          </span>
        ) : (
          <Mic className="size-9" />
        )}
      </button>
    </div>
  );
}
