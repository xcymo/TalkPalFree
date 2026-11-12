export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateLabel(dateKey: string): string {
  const today = toDateKey();
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000));
  if (dateKey === today) return '今天';
  if (dateKey === yesterday) return '昨天';
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });
  return `${month} 月 ${day} 日 · ${weekday}`;
}

export function formatHeaderDate(date: Date = new Date()): string {
  const monthDay = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'long' });
  return `${monthDay} · ${weekday}`;
}

/** Fast, stable cache key for a (voice, text) pair. */
export function ttsCacheKey(text: string, voice: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.codePointAt(i)!) >>> 0;
  }
  return `${voice}:${text.length}:${hash.toString(36)}`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function calculateStreak(dateKeys: string[]): number {
  const unique = new Set(dateKeys);
  if (unique.size === 0) return 0;
  const cursor = new Date();
  let streak = 0;
  // 今天还没练，从昨天开始算，连续天数不清零
  if (!unique.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!unique.has(toDateKey(cursor))) return 0;
  }
  while (unique.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}
