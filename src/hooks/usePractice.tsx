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
import type { PracticeStage, SessionRecord, Settings, TopicRecord } from '../types';
import { addSession, getSessionsForDate, getTodayTopic } from '../lib/db';
import { ensureTodayTopic } from '../lib/topicService';
import { correctAndReply, errorMessage, transcribeAudio } from '../lib/api';
import { convertToWav } from '../lib/audio';
import { toDateKey, ttsCacheKey } from '../lib/utils';
import { useSettings } from './useSettings';
import { useToast } from '../components/Toast';

interface PracticeContextValue {
  topic: TopicRecord | null | undefined;
  /** 当天该话题的全部轮次，按时间正序，带纠错、翻译等完整数据。 */
  rounds: SessionRecord[];
  stage: PracticeStage;
  error: string | null;
  /** 正在处理的一轮里，用户已经说/写的内容；ASR 返回前为 null。 */
  pendingUserText: string | null;
  /** 刚产生的一轮的 createdAt，用于只对新回复自动播放。 */
  freshRoundKey: number | null;
  sync: () => Promise<void>;
  processRecording: (blob: Blob) => void;
  processText: (text: string) => void;
  acknowledgeFreshRound: () => void;
  reportError: (message: string | null) => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

/**
 * 练习流程放在 App 级别的 Provider 里，切换页面（组件卸载）不会中断
 * ASR / LLM 请求，结果也会保留到下一次进入练习页。
 */
export function PracticeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const toast = useToast();

  const [topic, setTopic] = useState<TopicRecord | null | undefined>(undefined);
  const [rounds, setRounds] = useState<SessionRecord[]>([]);
  const [stage, setStage] = useState<PracticeStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [freshRoundKey, setFreshRoundKey] = useState<number | null>(null);

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
        setError(null);
        setFreshRoundKey(null);
      }

      if (!sameTopic || roundsRef.current.length === 0) {
        const existing = await getSessionsForDate(dateKey);
        setRounds(existing.filter((session) => session.topicTitleEn === todayTopic?.title_en));
      }
    } catch (err) {
      if (!topicRef.current) setTopic(null);
      setError(errorMessage(err));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const beginProcessing = useCallback((): { topic: TopicRecord; settings: Settings } | null => {
    const currentTopic = topicRef.current;
    const currentSettings = settingsRef.current;

    if (!currentTopic) {
      setError('今天还没有话题，请回到「今日」页生成后再练习。');
      return null;
    }
    if (!currentSettings.apiKey) {
      setError('还没有填写 MiMo API Key，请先到「设置」页保存 Key。');
      return null;
    }
    if (processingRef.current) return null;

    processingRef.current = true;
    setError(null);
    setPendingUserText(null);
    setFreshRoundKey(null);
    return { topic: currentTopic, settings: currentSettings };
  }, []);

  const finishProcessing = useCallback(() => {
    processingRef.current = false;
    setStage('idle');
  }, []);

  /** ASR 之后（文字输入则直接）共用的一轮：LLM 纠错 + 回复 + 写入本地记录。 */
  const submitUtterance = useCallback(
    async (currentTopic: TopicRecord, currentSettings: Settings, userText: string) => {
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

      const createdAt = Date.now();
      const record: Omit<SessionRecord, 'id'> = {
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
        createdAt,
      };

      let id: number | undefined;
      try {
        id = await addSession(record);
      } catch {
        toast('这一轮完成了，但本地记录保存失败。', 'error');
      }

      setRounds((previous) => [...previous, id === undefined ? record : { ...record, id }]);
      setFreshRoundKey(createdAt);
    },
    [toast],
  );

  const processRecording = useCallback(
    (blob: Blob) => {
      const context = beginProcessing();
      if (!context) return;

      void (async () => {
        try {
          setStage('transcribing');
          const wav = await convertToWav(blob);
          const userText = await transcribeAudio(context.settings.apiKey, wav);
          setPendingUserText(userText);
          setStage('thinking');
          await submitUtterance(context.topic, context.settings, userText);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setPendingUserText(null);
          finishProcessing();
        }
      })();
    },
    [beginProcessing, finishProcessing, submitUtterance],
  );

  /** 文字输入：跳过 ASR，直接把文本交给 LLM。 */
  const processText = useCallback(
    (text: string) => {
      const userText = text.trim();
      if (!userText) {
        setError('先写一句想说的英文，再交给 AI。');
        return;
      }

      const context = beginProcessing();
      if (!context) return;

      setPendingUserText(userText);

      void (async () => {
        try {
          setStage('thinking');
          await submitUtterance(context.topic, context.settings, userText);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setPendingUserText(null);
          finishProcessing();
        }
      })();
    },
    [beginProcessing, finishProcessing, submitUtterance],
  );

  const acknowledgeFreshRound = useCallback(() => {
    setFreshRoundKey(null);
  }, []);

  const reportError = useCallback((message: string | null) => {
    setError(message);
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeContextValue {
  const context = useContext(PracticeContext);
  if (!context) throw new Error('usePractice must be used inside PracticeProvider');
  return context;
}
