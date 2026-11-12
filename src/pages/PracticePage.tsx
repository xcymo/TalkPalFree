import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Lightbulb,
  Loader2,
  Mic,
  Volume2,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useRecorder } from '../hooks/useRecorder';
import { usePractice } from '../hooks/usePractice';
import { formatClock } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { TopicCard } from '../components/TopicCard';
import { RecordButton } from '../components/RecordButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { ResultSectionTitle } from '../components/CorrectionList';
import { SentenceCompare } from '../components/SentenceCompare';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { ReplyCard } from '../components/ReplyCard';
import { EmptyState } from '../components/EmptyState';
import type { Route } from '../hooks/useHashRoute';

interface PracticePageProps {
  navigate: (route: Route) => void;
}

export function PracticePage({ navigate }: PracticePageProps) {
  const { settings } = useSettings();
  const {
    topic,
    rounds,
    result,
    stage,
    error,
    sync,
    processRecording,
    nextRound,
    reportError,
  } = usePractice();

  const resultRef = useRef<HTMLDivElement | null>(null);
  const recorderPanelRef = useRef<HTMLDivElement | null>(null);

  const [autoPlayResult, setAutoPlayResult] = useState(false);
  const lastSeenResultRef = useRef(result);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (result && result !== lastSeenResultRef.current) {
      setAutoPlayResult(true);
    } else if (!result) {
      setAutoPlayResult(false);
    }
    lastSeenResultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [result]);

  const handleAutoPlayed = useCallback(() => {
    setAutoPlayResult(false);
  }, []);

  const recorder = useRecorder({
    onComplete: processRecording,
    onError: (message) => reportError(message),
  });

  const busy = stage === 'transcribing' || stage === 'thinking';
  const recording = recorder.isRecording;

  const handleStart = () => {
    reportError(null);
    if (!settings.apiKey) {
      reportError('还没有填写 MiMo API Key，请先到「设置」页保存 Key。');
      return;
    }
    if (!topic) {
      reportError('今天还没有话题，请回到「今日」页生成后再练习。');
      return;
    }
    void recorder.start();
  };

  const handleNext = () => {
    nextRound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleRounds = result ? rounds.slice(0, -1) : rounds;

  return (
    <div>
      <PageHeader title="练习" subtitle="开口说，剩下的交给 AI" />

      {topic === undefined ? (
        <div className="h-[74px] animate-pulse rounded-2xl border border-line bg-surface" />
      ) : topic ? (
        <TopicCard topic={topic} compact />
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

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} onDismiss={() => reportError(null)} />
        </div>
      )}

      {!result && topic && (
        <div
          ref={recorderPanelRef}
          className="mt-4 rounded-3xl border border-line bg-surface px-4 pb-5 pt-6 shadow-card"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-9 items-center">
              {recording ? (
                <p className="font-mono text-[30px] font-medium tabular-nums leading-none tracking-tight text-rose-500">
                  {formatClock(recorder.seconds)}
                </p>
              ) : busy ? (
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <Loader2 className="size-3.5 animate-spin" />
                  {stage === 'transcribing' ? '正在识别你说的英文…' : 'AI 正在纠错并组织回复…'}
                </div>
              ) : (
                <p className="text-[12.5px] text-muted">准备好就开始，说错也没关系</p>
              )}
            </div>

            <div className="mt-2">
              <RecordButton
                recording={recording}
                busy={busy}
                disabled={!topic}
                onStart={handleStart}
                onStop={recorder.stop}
              />
            </div>

            <p className="mt-2 text-[12.5px] font-medium text-ink">
              {recording ? '点击结束并提交' : busy ? '稍等一下…' : '点击开始说话'}
            </p>
            <p className="mt-1 text-[10.5px] text-muted">最长 60 秒 · 录音只发送给 MiMo</p>
          </div>

          {stage === 'transcribing' && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface2 px-3.5 py-2.5 text-[11.5px] text-muted">
              <AudioLines className="size-3.5 shrink-0 text-brand" />
              MiMo ASR 正在转写，保持网络通畅。
            </div>
          )}
        </div>
      )}

      {result && (
        <div ref={resultRef} className="mt-4 scroll-mt-4 space-y-4 animate-fade-up">
          <section>
            <ResultSectionTitle icon={Mic}>你的表达</ResultSectionTitle>
            <SentenceCompare
              userText={result.userText}
              optimizedSentence={result.optimized_full_sentence}
            />
          </section>

          <CorrectionsPanel corrections={result.corrections} />

          <section>
            <ResultSectionTitle icon={Volume2}>AI 回复</ResultSectionTitle>
            <ReplyCard
              text={result.reply_text}
              translation={result.reply_translation_zh}
              voice={settings.voice}
              autoPlay={autoPlayResult}
              onAutoPlayed={handleAutoPlayed}
            />
          </section>

          <button
            type="button"
            onClick={handleNext}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-[14.5px] font-semibold text-white shadow-float transition active:scale-[0.99] active:bg-brand-strong dark:text-[#1a1830]"
          >
            继续下一轮
            <ArrowRight className="size-4" />
          </button>
          <p className="flex items-center justify-center gap-1.5 pb-1 text-[11px] text-muted">
            <Lightbulb className="size-3" />
            话题不变，AI 会记得你们前面的对话
          </p>
        </div>
      )}

      {visibleRounds.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[12px] font-semibold text-muted">本话题的对话</h2>
            <span className="text-[10.5px] text-muted">{rounds.length} 轮</span>
          </div>
          <div className="space-y-2">
            {visibleRounds.map((round, index) => (
              <details
                key={`${round.userText}-${index}`}
                className="group rounded-2xl border border-line bg-surface px-3.5 py-2.5"
              >
                <summary className="flex cursor-pointer list-none items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">
                    U
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                    {round.userText}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted">
                    {round.correctionsCount > 0
                      ? `${round.correctionsCount} 处纠正`
                      : '很自然'}
                  </span>
                </summary>
                <div className="mt-2 space-y-1.5 border-t border-line pl-[30px] pt-2 text-[12px] leading-5">
                  <p className="text-muted">
                    <span className="font-medium text-ink">AI：</span>
                    {round.replyText}
                  </p>
                  {round.optimizedFullSentence && (
                    <p className="text-muted">
                      <span className="font-medium text-ink">自然说法：</span>
                      {round.optimizedFullSentence}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {!settings.apiKey && (
        <button
          type="button"
          onClick={() => navigate('settings')}
          className="mt-4 flex w-full min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[13px] font-medium text-brand"
        >
          去设置里填写 MiMo API Key
          <ArrowRight className="size-3.5" />
        </button>
      )}
    </div>
  );
}
