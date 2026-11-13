import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { ArrowRight, Keyboard, Mic, Send } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { usePractice } from '../hooks/usePractice';
import { useStickyBleed } from '../hooks/useStickyBleed';
import { PageHeader } from '../components/PageHeader';
import { TopicCard } from '../components/TopicCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { PracticeChat } from '../components/PracticeChat';
import { EmptyState } from '../components/EmptyState';
import { HoldToTalk } from '../components/HoldToTalk';
import { classNames } from '../lib/utils';
import type { Route } from '../hooks/useHashRoute';

interface PracticePageProps {
  navigate: (route: Route) => void;
}

type InputMode = 'voice' | 'text';

export function PracticePage({ navigate }: PracticePageProps) {
  const { settings } = useSettings();
  const {
    topic,
    rounds,
    stage,
    error,
    pendingUserText,
    freshRoundKey,
    sync,
    processRecording,
    processText,
    acknowledgeFreshRound,
    reportError,
  } = usePractice();

  const submittedTextRef = useRef<string | null>(null);
  const stickyRef = useStickyBleed<HTMLDivElement>();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceLayerRef = useRef<HTMLDivElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const focusTextRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  // 进入页面时已经存在的新回复不自动播放，只有本次停留期间产生的才播放。
  const initialFreshKeyRef = useRef(freshRoundKey);

  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [textDraft, setTextDraft] = useState('');
  const [autoPlayKey, setAutoPlayKey] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (freshRoundKey !== null && freshRoundKey !== initialFreshKeyRef.current) {
      setAutoPlayKey(freshRoundKey);
    }
  }, [freshRoundKey]);

  const handleAutoPlayed = useCallback(() => {
    setAutoPlayKey(null);
    acknowledgeFreshRound();
  }, [acknowledgeFreshRound]);

  // 有新轮次（包括首次从本地恢复）时滚到对话末尾。
  // 刚进入页面时直接跳到底部，只有停留在页面期间产生的新回复才平滑滚动。
  useEffect(() => {
    if (rounds.length === 0) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      window.scrollTo({ top: document.documentElement.scrollHeight });
      return;
    }
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [rounds.length]);

  // 出错时确保提示条出现在固定输入栏上方
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [error]);

  // 提交后用户消息 / 语音占位气泡立即出现，跟着滚到底部
  useEffect(() => {
    if (stage === 'idle') return;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [stage, pendingUserText]);

  // 文字发出后输入框已经清空；请求失败时把原文放回来方便重试
  useEffect(() => {
    if (submittedTextRef.current === null) return;
    const latest = rounds[rounds.length - 1];
    if (latest && latest.userText === submittedTextRef.current) {
      submittedTextRef.current = null;
      return;
    }
    if (error) {
      const text = submittedTextRef.current;
      submittedTextRef.current = null;
      setTextDraft(text);
      window.requestAnimationFrame(() => {
        const element = textareaRef.current;
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
        element.focus();
      });
    }
  }, [rounds, error]);

  const busy = stage !== 'idle';

  const handleBeforeStart = () => {
    reportError(null);
    if (!settings.apiKey) {
      reportError('还没有填写 MiMo API Key，请先到「设置」页保存 Key。');
      return false;
    }
    if (!topic) {
      reportError('今天还没有话题，请回到「今日」页生成后再练习。');
      return false;
    }
    return true;
  };

  const handleRecordingChange = useCallback((value: boolean) => {
    setRecording(value);
  }, []);

  const changeInputMode = (mode: InputMode) => {
    if (busy || recording) return;
    setInputMode(mode);
    focusTextRef.current = mode === 'text';
    if (mode === 'voice') textareaRef.current?.blur();
  };

  // 切到文字输入后聚焦输入框（放在 effect 里，保证 textarea 已经挂载）
  useEffect(() => {
    if (inputMode === 'text' && focusTextRef.current) {
      focusTextRef.current = false;
      textareaRef.current?.focus();
    }
  }, [inputMode]);

  // 非当前模式的图层设为 inert，避免隐藏的控件还能被点击或聚焦
  useLayoutEffect(() => {
    voiceLayerRef.current?.toggleAttribute('inert', inputMode !== 'voice');
    textLayerRef.current?.toggleAttribute('inert', inputMode !== 'text');
  }, [inputMode, topic]);

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTextDraft(event.target.value);
    if (error) reportError(null);
    const element = event.currentTarget;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  };

  const handleSubmitText = () => {
    const text = textDraft.trim();
    if (!text || busy) return;
    reportError(null);
    submittedTextRef.current = text;
    setTextDraft('');
    if (textareaRef.current) textareaRef.current.style.height = '';
    processText(text);
  };

  return (
    <div className="pb-14">
      <PageHeader title="练习" subtitle="说一句或写一句，剩下的交给 AI" />

      {topic === undefined ? (
        <div className="h-[74px] animate-pulse rounded-2xl border border-line bg-surface" />
      ) : topic ? (
        <div
          ref={stickyRef}
          className="sticky-safe sticky top-0 z-30 -mx-4 transform-gpu bg-bg px-4 pb-3 pt-2"
        >
          <TopicCard topic={topic} compact />
        </div>
      ) : (
        <EmptyState
          icon={Mic}
          title="还没有今天的话题"
          description="先去「今日」页生成一个话题，再回来开始练习。"
          action={
            <button
              type="button"
              onClick={() => navigate('today')}
              className="min-h-[46px] rounded-2xl bg-brand px-6 text-[14px] font-semibold text-white dark:text-[#1a1830]"
            >
              去生成话题
            </button>
          }
        />
      )}

      {(rounds.length > 0 || stage !== 'idle' || Boolean(topic?.icebreaker_en)) && (
        <div className="mt-4">
          <PracticeChat
            rounds={rounds}
            autoPlayKey={autoPlayKey}
            onAutoPlayed={handleAutoPlayed}
            pendingUserText={pendingUserText}
            stage={stage}
            openingText={topic?.icebreaker_en}
            openingTranslation={topic?.icebreaker_zh}
            voice={settings.voice}
          />
        </div>
      )}

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} onDismiss={() => reportError(null)} />
        </div>
      )}

      {!settings.apiKey && (
        <button
          type="button"
          onClick={() => navigate('settings')}
          className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[13px] font-medium text-brand"
        >
          去设置里填写 MiMo API Key
          <ArrowRight className="size-3.5" />
        </button>
      )}

      {topic && (
        <div
          className="fixed inset-x-0 z-30 mx-auto w-full max-w-[520px] overflow-hidden border-t border-line bg-surface px-3 py-2"
          style={{ bottom: 'calc(var(--nav-h, 4.25rem) - 2px)' }}
        >
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => changeInputMode(inputMode === 'voice' ? 'text' : 'voice')}
              disabled={busy || recording}
              aria-label={inputMode === 'voice' ? '切换到文字输入' : '切换到语音输入'}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition active:bg-surface2 disabled:opacity-50"
            >
              <span className="relative flex size-5 items-center justify-center" aria-hidden="true">
                <Keyboard
                  className={classNames(
                    'absolute size-5 transition-all duration-300',
                    inputMode === 'voice'
                      ? 'rotate-0 scale-100 opacity-100'
                      : 'rotate-90 scale-75 opacity-0',
                  )}
                />
                <Mic
                  className={classNames(
                    'absolute size-5 transition-all duration-300',
                    inputMode === 'text'
                      ? 'rotate-0 scale-100 opacity-100'
                      : '-rotate-90 scale-75 opacity-0',
                  )}
                />
              </span>
            </button>

            <div className="relative min-w-0 flex-1">
              <div
                ref={voiceLayerRef}
                aria-hidden={inputMode !== 'voice'}
                className={classNames(
                  'flex w-full items-end gap-2 transition-all duration-200 ease-out',
                  inputMode === 'voice'
                    ? 'relative translate-x-0 opacity-100'
                    : 'pointer-events-none absolute inset-x-0 bottom-0 -translate-x-3 opacity-0',
                )}
              >
                <HoldToTalk
                  busy={busy}
                  busyLabel={stage === 'transcribing' ? '正在识别…' : 'AI 正在回复…'}
                  onBeforeStart={handleBeforeStart}
                  onComplete={processRecording}
                  onError={reportError}
                  onRecordingChange={handleRecordingChange}
                />
              </div>

              <div
                ref={textLayerRef}
                aria-hidden={inputMode !== 'text'}
                className={classNames(
                  'flex w-full items-end gap-2 transition-all duration-200 ease-out',
                  inputMode === 'text'
                    ? 'relative translate-x-0 opacity-100'
                    : 'pointer-events-none absolute inset-x-0 bottom-0 translate-x-3 opacity-0',
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={textDraft}
                  onChange={handleDraftChange}
                  disabled={busy}
                  rows={1}
                  aria-label="输入想说的英文"
                  placeholder="输入英文…"
                  className="max-h-24 min-h-[40px] flex-1 resize-none rounded-2xl border border-line bg-surface2 px-3 py-2 text-[15px] leading-6 text-ink placeholder:text-muted focus:border-brand focus:outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSubmitText}
                  disabled={busy || !textDraft.trim()}
                  aria-label="发送"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition active:bg-brand-strong disabled:opacity-40 dark:text-[#1a1830]"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
