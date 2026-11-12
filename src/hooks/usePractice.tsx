import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ConversationRound,
  CorrectionResult,
  PracticeStage,
  TopicRecord,
} from '../types';
import { addSession, getSessionsForDate, getTodayTopic } from '../lib/db';
import { ensureTodayTopic } from '../lib/topicService';
import { correctAndReply, errorMessage, transcribeAudio } from '../lib/api';
import { convertToWav } from '../lib/audio';
import { toDateKey, ttsCacheKey } from '../lib/utils';
import { useSettings } from './useSettings';
import { useToast } from '../components/Toast';

export interface PracticeResult extends CorrectionResult {
  userText: string;
}

interface PracticeContextValue {
  topic: TopicRecord | null | undefined;
  rounds: ConversationRound[];
  result: PracticeResult | null;
  stage: PracticeStage;
  error: string | null;
  sync: () => Promise<void>;
  processRecording: (blob: Blob) => void;
  nextRound: () => void;
  reportError: (message: string | null) => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

function toRounds(sessions: Awaited<ReturnType<typeof getSessionsForDate>>): ConversationRound[] {
  return sessions.map((session) => ({
    userText: session.userText,
    replyText: session.replyText,
    correctionsCount: session.corrections.length,
    optimizedFullSentence: session.optimizedFullSentence,
  }));
}

/**
 * 练习流程放在 App 级别的 Provider 里，切换页面（组件卸载）不会中断
 * ASR / LLM 请求，结果也会保留到下一次进入练习页。
 */
export function PracticeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const toast = useToast();

  const [topic, setTopic] = useState<TopicRecord | null | undefined>(undefined);
  const [rounds, setRounds] = useState<ConversationRound[]>([]);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [stage, setStage] = useState<PracticeStage>('idle');
  const [error, setError] = useState<string | null>(null);

  const topicRef = useRef(topic);
  const roundsRef = useRef(rounds);
  const stageRef = useRef(stage);
  const settingsRef = useRef(settings);
  const processingRef = useRef(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    topicRef.current = topic;
  }, [topic]);
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const sync = useCallback(async () => {
    if (syncingRef.current || stageRef.current !== 'idle' || processingRef.current) return;
    syncingRef.current = true;
    try {
      const dateKey = toDateKey();
      let todayTopic = (await getTodayTopic(dateKey)) ?? null;
      if (!todayTopic) {
        todayTopic = (await ensureTodayTopic(settingsRef.current.apiKey)).topic;
      }

      const current = topicRef.current;
      const sameTopic =
        Boolean(current && todayTopic) &&
        current?.dateKey === todayTopic?.dateKey &&
        current?.title_en === todayTopic?.title_en;

      setTopic(todayTopic);
      if (!sameTopic) {
        setResult(null);
        setError(null);
      }

      if (!sameTopic || roundsRef.current.length === 0) {
        const existing = await getSessionsForDate(dateKey);
        setRounds(
          toRounds(
            existing.filter((session) => session.topicTitleEn === todayTopic?.title_en),
          ),
        );
      }
    } catch (err) {
      if (!topicRef.current) setTopic(null);
      setError(errorMessage(err));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const processRecording = useCallback(
    (blob: Blob) => {
      const currentTopic = topicRef.current;
      const currentSettings = settingsRef.current;

      if (!currentTopic) {
        setError('今天还没有话题，请回到「今日」页生成后再练习。');
        return;
      }
      if (!currentSettings.apiKey) {
        setError('还没有填写 MiMo API Key，请先到「设置」页保存 Key。');
        return;
      }
      if (processingRef.current) return;

      processingRef.current = true;
      setError(null);
      setResult(null);
      setStage('transcribing');

      void (async () => {
        try {
          const wav = await convertToWav(blob);
          const userText = await transcribeAudio(currentSettings.apiKey, wav);
          setStage('thinking');

          const history: { role: 'user' | 'assistant'; content: string }[] = [];
          if (currentTopic.icebreaker_en) {
            history.push({ role: 'assistant', content: currentTopic.icebreaker_en });
          }
          for (const round of roundsRef.current) {
            history.push({ role: 'user', content: round.userText });
            history.push({ role: 'assistant', content: round.replyText });
          }

          const response = await correctAndReply({
            apiKey: currentSettings.apiKey,
            topic: `${currentTopic.title_en} (${currentTopic.scene_en})\n${currentTopic.prompt_zh}`,
            history,
            utterance: userText,
          });

          setResult({ ...response, userText });
          setRounds((previous) => [
            ...previous,
            {
              userText,
              replyText: response.reply_text,
              correctionsCount: response.corrections.length,
              optimizedFullSentence: response.optimized_full_sentence,
            },
          ]);

          try {
            await addSession({
              dateKey: currentTopic.dateKey,
              topicId: currentTopic.dateKey,
              topicTitleEn: currentTopic.title_en,
              topicTitleZh: currentTopic.title_zh,
              userText,
              corrections: response.corrections,
              optimizedFullSentence: response.optimized_full_sentence,
              replyText: response.reply_text,
              replyTranslationZh: response.reply_translation_zh,
              ttsCacheKey: ttsCacheKey(response.reply_text, currentSettings.voice),
              voice: currentSettings.voice,
              createdAt: Date.now(),
            });
          } catch {
            toast('这一轮完成了，但本地记录保存失败。', 'error');
          }
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          processingRef.current = false;
          setStage('idle');
        }
      })();
    },
    [toast],
  );

  const nextRound = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const reportError = useCallback((message: string | null) => {
    setError(message);
  }, []);

  const value = useMemo(
    () => ({
      topic,
      rounds,
      result,
      stage,
      error,
      sync,
      processRecording,
      nextRound,
      reportError,
    }),
    [topic, rounds, result, stage, error, sync, processRecording, nextRound, reportError],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeContextValue {
  const context = useContext(PracticeContext);
  if (!context) throw new Error('usePractice must be used inside PracticeProvider');
  return context;
}
