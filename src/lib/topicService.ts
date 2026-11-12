import { generateDailyTopic } from './api';
import { db, getTodayTopic, saveTodayTopic } from './db';
import { toDateKey } from './utils';
import type { TopicRecord } from '../types';

export interface TopicResult {
  topic: TopicRecord;
  warning?: string;
}

const inflight = new Map<string, Promise<TopicResult>>();

async function usedTitlesFor(dateKey: string): Promise<string[]> {
  const topics = await db.topics.orderBy('createdAt').toArray();
  return topics
    .filter((topic) => topic.dateKey !== dateKey)
    .map((topic) => topic.title_en);
}

/** 每天首次打开时生成一次话题；并发调用会复用同一个请求。 */
export async function ensureTodayTopic(apiKey: string): Promise<TopicResult> {
  const dateKey = toDateKey();
  const existing = await getTodayTopic(dateKey);
  if (existing) return { topic: existing };

  const pending = inflight.get(dateKey);
  if (pending) return pending;

  const promise = (async () => {
    const used = await usedTitlesFor(dateKey);
    const generated = await generateDailyTopic(apiKey, used.slice(-10));
    const record: TopicRecord = {
      dateKey,
      ...generated.topic,
      poolId: generated.poolId,
      source: generated.source,
      createdAt: Date.now(),
    };
    await saveTodayTopic(record);
    return { topic: record, warning: generated.warning };
  })().finally(() => {
    inflight.delete(dateKey);
  });

  inflight.set(dateKey, promise);
  return promise;
}

export async function regenerateTodayTopic(
  apiKey: string,
  current?: TopicRecord | null,
): Promise<TopicResult> {
  const dateKey = toDateKey();
  const used = await usedTitlesFor(dateKey);
  if (current) used.push(current.title_en);

  const generated = await generateDailyTopic(
    apiKey,
    used.slice(-10),
    current ? [current.poolId] : [],
  );

  const record: TopicRecord = {
    dateKey,
    ...generated.topic,
    poolId: generated.poolId,
    source: generated.source,
    createdAt: Date.now(),
  };
  await saveTodayTopic(record);
  return { topic: record, warning: generated.warning };
}
