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

const GREETING_ACTIONS = [
  '来说两句吧',
  '来练习一下',
  '今天说点什么',
  '随便聊两句',
  '开口练一练',
  '今天想聊什么',
  '来点口语练习',
  '用英语唠两句',
  '练练嘴皮子',
  '今天也来说说',
  '一起说说英语',
  '今天练几句',
  '来聊两分钟',
  '今天说点啥',
  '练练口语吧',
  '说说今天的事',
  '来段英文对话',
  '今天也练练',
  '用英语聊聊天',
  '来练一小段',
];

const GREETING_ACTION_KEY = 'spoken-english:greeting-action';
const GREETING_ACTION_ROTATE_MS = 60 * 60 * 1000;

interface StoredGreetingAction {
  text: string;
  pickedAt: number;
}

function readStoredGreetingAction(): StoredGreetingAction | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(GREETING_ACTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredGreetingAction>;
    if (typeof parsed.text !== 'string' || !GREETING_ACTIONS.includes(parsed.text)) {
      return null;
    }
    if (typeof parsed.pickedAt !== 'number' || !Number.isFinite(parsed.pickedAt)) {
      return null;
    }
    return { text: parsed.text, pickedAt: parsed.pickedAt };
  } catch {
    return null;
  }
}

/**
 * 每小时的问候语后半句。选中的文案会缓存一小时；
 * 切换页面、刷新页面都保持不变，满一小时后才会换一条。
 */
export function getGreetingAction(now = Date.now()): string {
  const stored = readStoredGreetingAction();
  if (
    stored &&
    now - stored.pickedAt >= 0 &&
    now - stored.pickedAt < GREETING_ACTION_ROTATE_MS
  ) {
    return stored.text;
  }

  const choices = stored
    ? GREETING_ACTIONS.filter((action) => action !== stored.text)
    : GREETING_ACTIONS;
  const text = choices[Math.floor(Math.random() * choices.length)] ?? GREETING_ACTIONS[0];

  try {
    if (typeof localStorage !== 'undefined') {
      const payload: StoredGreetingAction = { text, pickedAt: now };
      localStorage.setItem(GREETING_ACTION_KEY, JSON.stringify(payload));
    }
  } catch {
    // localStorage 不可用时退回为每次随机，不影响页面
  }

  return text;
}
