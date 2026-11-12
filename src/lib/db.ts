import Dexie, { type Table } from 'dexie';
import type {
  AudioCacheRecord,
  SessionRecord,
  TopicRecord,
  UsageRecord,
} from '../types';
import { toDateKey } from './utils';

class SpokenEnglishDB extends Dexie {
  topics!: Table<TopicRecord, string>;
  sessions!: Table<SessionRecord, number>;
  audioCache!: Table<AudioCacheRecord, string>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('spoken-english');
    this.version(1).stores({
      topics: 'dateKey, createdAt',
      sessions: '++id, dateKey, topicId, createdAt',
      audioCache: 'key, createdAt',
      meta: 'key',
    });
  }
}

export const db = new SpokenEnglishDB();

export async function getTodayTopic(dateKey = toDateKey()): Promise<TopicRecord | undefined> {
  return db.topics.get(dateKey);
}

export async function saveTodayTopic(topic: TopicRecord): Promise<void> {
  await db.topics.put(topic);
}

export async function addSession(session: Omit<SessionRecord, 'id'>): Promise<number> {
  const id = await db.sessions.add(session as SessionRecord);
  return id as number;
}

export async function getSessions(): Promise<SessionRecord[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray();
}

export async function getSessionsForDate(dateKey: string): Promise<SessionRecord[]> {
  return db.sessions.where('dateKey').equals(dateKey).sortBy('createdAt');
}

export async function getTtsBlob(key: string): Promise<Blob | null> {
  const record = await db.audioCache.get(key);
  return record?.blob ?? null;
}

export async function putTtsBlob(
  key: string,
  blob: Blob,
  meta: { voice: string; text: string },
): Promise<void> {
  await db.audioCache.put({
    key,
    blob,
    voice: meta.voice,
    text: meta.text,
    createdAt: Date.now(),
  });
  // 控制缓存体积：最多保留 120 条
  const count = await db.audioCache.count();
  if (count > 120) {
    const stale = await db.audioCache.orderBy('createdAt').limit(count - 120).toArray();
    await db.audioCache.bulkDelete(stale.map((item) => item.key));
  }
}

const emptyUsage = (): UsageRecord => ({
  llmTokens: 0,
  asrRequests: 0,
  ttsChars: 0,
  updatedAt: Date.now(),
});

export async function trackUsage(delta: Partial<Omit<UsageRecord, 'updatedAt'>>): Promise<void> {
  const keys = ['usage:total', `usage:${toDateKey()}`];
  for (const key of keys) {
    const current = (await db.meta.get(key))?.value as UsageRecord | undefined;
    const base = current ?? emptyUsage();
    await db.meta.put({
      key,
      value: {
        llmTokens: base.llmTokens + (delta.llmTokens ?? 0),
        asrRequests: base.asrRequests + (delta.asrRequests ?? 0),
        ttsChars: base.ttsChars + (delta.ttsChars ?? 0),
        updatedAt: Date.now(),
      } satisfies UsageRecord,
    });
  }
}

export async function getUsage(dateKey = toDateKey()): Promise<UsageRecord> {
  const value = (await db.meta.get(`usage:${dateKey}`))?.value as UsageRecord | undefined;
  return value ?? emptyUsage();
}

export async function getTotalUsage(): Promise<UsageRecord> {
  const value = (await db.meta.get('usage:total'))?.value as UsageRecord | undefined;
  return value ?? emptyUsage();
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.topics, db.sessions, db.audioCache, db.meta, async () => {
    await Promise.all([
      db.topics.clear(),
      db.sessions.clear(),
      db.audioCache.clear(),
      db.meta.clear(),
    ]);
  });
}
