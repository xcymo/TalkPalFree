import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold">页面出了点小状况</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted">
              你的练习记录都安全地保存在本地。刷新页面即可继续。
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[46px] rounded-2xl bg-brand px-7 text-[14px] font-semibold text-white"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
