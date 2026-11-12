import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-rose-200/70 bg-rose-50/90 px-3.5 py-3 text-[13px] text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1 leading-5">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline underline-offset-2"
        >
          重试
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="关闭提示"
          className="-mr-1 -mt-1 rounded-full p-1.5 text-rose-500 active:bg-rose-100 dark:active:bg-rose-400/10"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
