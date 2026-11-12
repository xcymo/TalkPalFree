import { Loader2 } from 'lucide-react';
import { classNames } from '../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('size-5 animate-spin', className)} aria-hidden="true" />;
}

export function FullPageLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="size-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
