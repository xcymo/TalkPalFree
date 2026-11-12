import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-[420px] rounded-3xl border border-line bg-surface p-5 shadow-float animate-fade-up"
      >
        <h2 id="confirm-title" className="text-[16px] font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="mt-2 text-[13px] leading-6 text-muted">{description}</p>}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[46px] flex-1 rounded-2xl border border-line bg-surface2 text-[14px] font-medium text-ink active:opacity-80"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'min-h-[46px] flex-1 rounded-2xl bg-rose-500 text-[14px] font-semibold text-white active:bg-rose-600'
                : 'min-h-[46px] flex-1 rounded-2xl bg-brand text-[14px] font-semibold text-white active:bg-brand-strong dark:text-[#1a1830]'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
