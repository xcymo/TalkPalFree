import type { Settings, ThemeMode } from '../types';
import { DEFAULT_VOICE } from '../config/voices';

export const SETTINGS_KEY = 'spoken-english:settings';

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  voice: DEFAULT_VOICE,
  theme: 'system',
  autoPlay: true,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      voice: typeof parsed.voice === 'string' ? parsed.voice : DEFAULT_VOICE,
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
      autoPlay: typeof parsed.autoPlay === 'boolean' ? parsed.autoPlay : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function persistSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function isTheme(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', resolved === 'dark' ? '#131211' : '#f7f6f3');
  });
}
