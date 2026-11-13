import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Flame, KeyRound, Mic, PenLine } from 'lucide-react';
import type { TopicRecord } from '../types';
import { db } from '../lib/db';
import { errorMessage } from '../lib/api';
import { ensureTodayTopic, generateCustomTodayTopic, regenerateTodayTopic } from '../lib/topicService';
import { calculateStreak, formatHeaderDate, getGreeting, toDateKey } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../components/Toast';
import { TopicCard } from '../components/TopicCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { Info } from 'lucide-react';
import type { Route } from '../hooks/useHashRoute';

interface TodayPageProps {
  navigate: (route: Route) => void;
}

export function TodayPage({ navigate }: TodayPageProps) {
  const { settings } = useSettings();
  const toast = useToast();
  const dateKey = toDateKey();

  const [topic, setTopic] = useState<TopicRecord | null | undefined>(undefined);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');
  const [customGenerating, setCustomGenerating] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [contentPad, setContentPad] = useState(0);

  // 标题区固定后，用它的实际高度（含安全区）给内容留出空间
  useLayoutEffect(() => {
    const header = headerRef.current;
    const parent = rootRef.current?.parentElement;
    if (!header || !parent) return;
    const apply = () => {
      const parentPad = parseFloat(getComputedStyle(parent).paddingTop) || 0;
      setContentPad(Math.max(0, header.offsetHeight - parentPad + 8));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const sessions =
    useLiveQuery(() => db.sessions.orderBy('createdAt').reverse().toArray(), []) ?? [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await ensureTodayTopic(settings.apiKey);
        if (cancelled) return;
        setTopic(result.topic);
        setWarning(result.warning ?? null);
      } catch (err) {
        if (!cancelled) {
          setTopic(null);
          setError(errorMessage(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅在页面首次挂载时准备今日话题
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (regenerating || customGenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const result = await regenerateTodayTopic(settings.apiKey, topic ?? null);
      setTopic(result.topic);
      setWarning(result.warning ?? null);
      toast('换好新话题了', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRegenerating(false);
    }
  }, [settings.apiKey, topic, toast, regenerating, customGenerating]);

  const handleCustomGenerate = useCallback(async () => {
    const keyword = customKeyword.trim();
    if (!keyword || customGenerating || regenerating) return;
    setCustomGenerating(true);
    setError(null);
    try {
      const result = await generateCustomTodayTopic(settings.apiKey, keyword, topic ?? null);
      setTopic(result.topic);
      setWarning(null);
      setCustomOpen(false);
      setCustomKeyword('');
      toast('已按关键词生成新话题', 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCustomGenerating(false);
    }
  }, [customKeyword, customGenerating, regenerating, settings.apiKey, topic, toast]);

  const todaySessions = sessions.filter((session) => session.dateKey === dateKey);
  const streak = calculateStreak(sessions.map((session) => session.dateKey));

  return (
    <div ref={rootRef} style={{ paddingTop: contentPad }}>
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-30">
        <div className="fade-header relative pt-safe mx-auto w-full max-w-[520px] px-4">
          <header className="pb-4 pt-2">
            <p className="text-[12px] text-muted">{formatHeaderDate()}</p>
            <h1 className="mt-1 text-[25px] font-semibold leading-tight tracking-tight text-ink">
              {getGreeting()}，来说两句吧
            </h1>
          </header>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <Mic className="size-3.5" />
            今日练习
          </div>
          <p className="mt-1.5 text-[24px] font-semibold leading-none text-ink">
            {todaySessions.length}
            <span className="ml-1 text-[12px] font-normal text-muted">轮</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <Flame className="size-3.5 text-amber-500" />
            连续打卡
          </div>
          <p className="mt-1.5 text-[24px] font-semibold leading-none text-ink">
            {streak}
            <span className="ml-1 text-[12px] font-normal text-muted">天</span>
          </p>
        </div>
      </div>

      {!settings.apiKey && (
        <button
          type="button"
          onClick={() => navigate('settings')}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-left transition active:opacity-80 dark:border-amber-400/20 dark:bg-amber-400/[0.08]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <KeyRound className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold text-ink">
              还没有填写 MiMo API Key
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted">
              语音识别和 AI 回复都需要它
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </button>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {warning && settings.apiKey && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-line bg-surface2 px-3.5 py-2.5 text-[11.5px] leading-5 text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      <TopicCard
        topic={topic ?? null}
        loading={topic === undefined}
        regenerating={regenerating}
        onRegenerate={handleRegenerate}
        onStart={() => navigate('practice')}
      />

      {topic !== undefined && (
        <div className="mt-3">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setCustomOpen((value) => !value);
                if (error) setError(null);
              }}
              className="flex items-center gap-1.5 text-[11.5px] text-muted transition active:opacity-70"
            >
              <PenLine className="size-3" />
              想聊别的？输入关键词生成话题
            </button>
          </div>

          {customOpen && (
            <div className="mt-2.5 rounded-2xl border border-line bg-surface p-3 shadow-card animate-fade-up">
              <div className="flex items-center gap-2">
                <input
                  value={customKeyword}
                  onChange={(event) => {
                    setCustomKeyword(event.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCustomGenerate();
                    }
                  }}
                  placeholder="比如：机场转机、面试、租房"
                  maxLength={40}
                  autoFocus
                  aria-label="输入话题关键词"
                  className="min-h-[40px] min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
                />
                <button
                  type="button"
                  onClick={() => void handleCustomGenerate()}
                  disabled={!customKeyword.trim() || customGenerating || regenerating}
                  className="flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 text-[12.5px] font-semibold text-white transition active:bg-brand-strong disabled:opacity-50 dark:text-[#1a1830]"
                >
                  {customGenerating ? (
                    <>
                      <Spinner className="size-3.5" />
                      生成中…
                    </>
                  ) : (
                    '生成'
                  )}
                </button>
              </div>
              <p className="mt-2 text-[10.5px] leading-4 text-muted">
                AI 会按关键词生成场景、话题和开场白。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
