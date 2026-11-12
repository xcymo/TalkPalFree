import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Flame, KeyRound, Lightbulb, Mic } from 'lucide-react';
import type { TopicRecord } from '../types';
import { db } from '../lib/db';
import { errorMessage } from '../lib/api';
import { ensureTodayTopic, regenerateTodayTopic } from '../lib/topicService';
import { calculateStreak, formatHeaderDate, getGreeting, toDateKey } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../components/Toast';
import { TopicCard } from '../components/TopicCard';
import { ErrorBanner } from '../components/ErrorBanner';
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
  }, [settings.apiKey, topic, toast]);

  const todaySessions = sessions.filter((session) => session.dateKey === dateKey);
  const streak = calculateStreak(sessions.map((session) => session.dateKey));

  return (
    <div>
      <header className="pb-4 pt-2">
        <p className="text-[12px] text-muted">{formatHeaderDate()}</p>
        <h1 className="mt-1 text-[25px] font-semibold leading-tight tracking-tight text-ink">
          {getGreeting()}，来说两句吧
        </h1>
      </header>

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

      <div className="mt-4 flex items-start gap-2 px-1 text-[11.5px] leading-5 text-muted">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
        <p>先开口，再看纠错。每轮只要 1 分钟，连续几天你会明显感觉到变化。</p>
      </div>
    </div>
  );
}
