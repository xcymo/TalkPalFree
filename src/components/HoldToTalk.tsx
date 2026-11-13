import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { AudioLines, Loader2, Mic } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { classNames, formatClock } from '../lib/utils';
import { useToast } from './Toast';

interface HoldToTalkProps {
  busy: boolean;
  busyLabel?: string;
  onBeforeStart: () => boolean;
  onComplete: (blob: Blob, durationSeconds: number) => void;
  onError: (message: string) => void;
  onRecordingChange?: (recording: boolean) => void;
}

/** 手指上滑超过这个距离就进入取消状态。 */
const CANCEL_DISTANCE = 64;

export function HoldToTalk({
  busy,
  busyLabel = '处理中…',
  onBeforeStart,
  onComplete,
  onError,
  onRecordingChange,
}: HoldToTalkProps) {
  const toast = useToast();
  const [pressed, setPressed] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const pressedRef = useRef(false);
  const cancelingRef = useRef(false);
  const startYRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  function resetInteraction() {
    pressedRef.current = false;
    cancelingRef.current = false;
    pointerIdRef.current = null;
    setPressed(false);
    setCanceling(false);
  }

  const recorder = useRecorder({
    onComplete: (blob, duration) => {
      resetInteraction();
      onComplete(blob, duration);
    },
    onError: (message) => {
      resetInteraction();
      onError(message);
    },
  });

  useEffect(() => {
    onRecordingChange?.(recorder.isRecording);
  }, [recorder.isRecording, onRecordingChange]);

  useEffect(
    () => () => {
      onRecordingChange?.(false);
    },
    [onRecordingChange],
  );

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (busy || pressedRef.current) return;
    if (!onBeforeStart()) return;

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 个别浏览器不支持指针捕获，退化为普通事件
    }
    pointerIdRef.current = event.pointerId;
    startYRef.current = event.clientY;
    pressedRef.current = true;
    cancelingRef.current = false;
    setPressed(true);
    setCanceling(false);
    void recorder.start();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!pressedRef.current || pointerIdRef.current !== event.pointerId) return;
    const next = startYRef.current - event.clientY > CANCEL_DISTANCE;
    if (next !== cancelingRef.current) {
      cancelingRef.current = next;
      setCanceling(next);
    }
  };

  const finish = (shouldCancel: boolean) => {
    if (!pressedRef.current) return;
    resetInteraction();
    if (shouldCancel) {
      recorder.cancel();
      toast('已取消本次录音', 'info');
    } else {
      recorder.stop();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    finish(cancelingRef.current);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    finish(true);
  };

  const handleLostPointerCapture = () => {
    if (pressedRef.current) finish(true);
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="按住说话，上滑取消"
        className={classNames(
          'flex h-10 flex-1 touch-none select-none items-center justify-center gap-1.5 rounded-full text-[13.5px] font-medium transition',
          pressed
            ? canceling
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300'
              : 'bg-brand-soft text-brand'
            : 'bg-surface2 text-ink active:bg-surface',
          busy && 'opacity-60',
        )}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {busyLabel}
          </>
        ) : pressed ? (
          canceling ? '松开取消' : '松开结束'
        ) : (
          <>
            <Mic className="size-4" />
            按住说话
          </>
        )}
      </button>

      {pressed &&
        !busy &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
            style={{ bottom: 'calc(var(--nav-h, 4.25rem) + 4.5rem)' }}
          >
            <div
              className={classNames(
                'flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-float backdrop-blur',
                canceling ? 'bg-rose-600/90 text-white' : 'bg-stone-900/85 text-white',
              )}
            >
              <AudioLines className="size-4 shrink-0" />
              <span className="font-mono text-[15px] tabular-nums">
                {formatClock(recorder.seconds)}
              </span>
              <span className="text-[11px] text-white/85">
                {canceling ? '松开手指取消' : '松开结束 · 上滑取消'}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
