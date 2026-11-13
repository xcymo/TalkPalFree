import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Eye,
  EyeOff,
  ExternalLink,
  Gauge,
  Info,
  KeyRound,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';
import type { ThemeMode, UsageRecord } from '../types';
import { API_BASE_URL, MODELS } from '../config/models';
import { clearAllData, getTotalUsage, getUsage } from '../lib/db';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../components/Toast';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { VoiceSelect } from '../components/VoiceSelect';
import { classNames } from '../lib/utils';

const EMPTY_USAGE: UsageRecord = { llmTokens: 0, asrRequests: 0, ttsChars: 0, updatedAt: 0 };

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
];

function estimateTokens(usage: UsageRecord): number {
  return usage.llmTokens + usage.asrRequests * 150 + Math.ceil(usage.ttsChars / 4);
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const toast = useToast();

  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [contentPad, setContentPad] = useState(0);

  // 标题栏固定后，用它的实际高度（含安全区）给内容留出空间
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

  const todayUsage = useLiveQuery(() => getUsage(), []) ?? EMPTY_USAGE;
  const totalUsage = useLiveQuery(() => getTotalUsage(), []) ?? EMPTY_USAGE;
  const activeThemeIndex = Math.max(
    0,
    THEMES.findIndex((theme) => theme.value === settings.theme),
  );

  const saveKey = () => {
    const trimmed = keyDraft.trim();
    updateSettings({ apiKey: trimmed });
    setKeyDraft(trimmed);
    toast(trimmed ? 'API Key 已保存在本地' : '已清除 API Key', 'success');
  };

  const clearData = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearAllData();
      Object.keys(localStorage)
        .filter((key) => key.startsWith('spoken-english'))
        .forEach((key) => localStorage.removeItem(key));
      resetSettings();
      setKeyDraft('');
      setConfirmOpen(false);
      toast('本地数据已清除，话题会重新生成', 'success');
    } catch {
      toast('清除失败，请刷新页面后重试', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div ref={rootRef} style={{ paddingTop: contentPad }}>
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-30">
        <div className="fade-header relative pt-safe mx-auto w-full max-w-[520px] px-4">
          <PageHeader title="设置" subtitle="Key 和练习数据都只留在本机浏览器" />
        </div>
      </div>

      <Section
        title="MiMo API Key"
        description="所有请求直接发往 api.xiaomimimo.com，不经过任何第三方服务器。"
        icon={KeyRound}
      >
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyDraft}
            onChange={(event) => setKeyDraft(event.target.value)}
            placeholder="粘贴你的 MiMo API Key"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-h-[48px] w-full rounded-2xl border border-line bg-surface2 px-3.5 pr-14 text-[13.5px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
          />
          <button
            type="button"
            onClick={() => setShowKey((value) => !value)}
            aria-label={showKey ? '隐藏 Key' : '显示 Key'}
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted active:bg-surface"
          >
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={saveKey}
          className="mt-2.5 min-h-[46px] w-full rounded-2xl bg-brand text-[14px] font-semibold text-white transition active:bg-brand-strong dark:text-[#1a1830]"
        >
          保存 Key
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted">Key 以明文保存在 localStorage，仅本机可见。</p>
          <a
            href="https://platform.xiaomimimo.com/"
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand"
          >
            获取 Key
            <ExternalLink className="size-3" />
          </a>
        </div>
      </Section>

      <Section
        title="语音音色"
        description="用于朗读 AI 回复。英文对话推荐 Mia / Chloe / Milo / Dean。"
        icon={Volume2}
      >
        <VoiceSelect
          value={settings.voice}
          onChange={(voice) => updateSettings({ voice })}
        />
        <p className="mt-2 text-[11px] text-muted">
          更换音色后，同一段回复会按新音色重新生成一次并缓存。
        </p>
      </Section>

      <Section title="外观" icon={Monitor}>
        <div className="relative rounded-2xl bg-surface2 p-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 grid grid-cols-3 gap-1"
          >
            <div
              className="col-start-1 row-start-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform: `translateX(calc(${activeThemeIndex * 100}% + ${
                  activeThemeIndex * 0.25
                }rem))`,
              }}
            >
              <span
                key={settings.theme}
                className="block h-full rounded-xl bg-surface shadow-card animate-tab-shuttle"
              />
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-1">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              const active = settings.theme === theme.value;
              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => updateSettings({ theme: theme.value })}
                  className={classNames(
                    'relative z-10 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-[12px] transition-colors duration-300',
                    active ? 'font-semibold text-ink' : 'text-muted active:bg-surface',
                  )}
                >
                  <Icon
                    className={classNames(
                      'size-3.5 transition-transform duration-300',
                      active ? 'scale-110' : 'scale-100',
                    )}
                  />
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section
        title="自动播放 AI 回复"
        description="每轮结果出来后自动播放语音；如果浏览器拦截，可手动点击播放。"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink">自动播放</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoPlay}
            aria-label="自动播放 AI 回复"
            onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
            className={classNames(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              settings.autoPlay ? 'bg-brand' : 'bg-stone-300 dark:bg-stone-700',
            )}
          >
            <span
              className={classNames(
                'absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200',
                settings.autoPlay ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </Section>

      <Section
        title="用量估算"
        description="仅前端粗略统计，实际计费请以 MiMo 控制台为准。"
        icon={Gauge}
      >
        <div className="grid grid-cols-2 gap-2.5">
          <UsageCard label="今日" usage={todayUsage} />
          <UsageCard label="累计" usage={totalUsage} />
        </div>
        <div className="mt-3 space-y-1.5 rounded-xl bg-surface2 px-3 py-2.5 text-[11px] text-muted">
          <p>LLM tokens（服务端返回）：今日 {todayUsage.llmTokens} · 累计 {totalUsage.llmTokens}</p>
          <p>ASR 请求：今日 {todayUsage.asrRequests} 次 · 累计 {totalUsage.asrRequests} 次</p>
          <p>TTS 字符：今日 {todayUsage.ttsChars} · 累计 {totalUsage.ttsChars}</p>
        </div>
      </Section>

      <Section title="数据" icon={ShieldCheck}>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-50 text-[13.5px] font-medium text-rose-600 transition active:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
        >
          <Trash2 className="size-4" />
          清除本地数据并重置
        </button>
        <p className="mt-2.5 text-[11px] leading-5 text-muted">
          会删除 IndexedDB 里的练习记录、话题和语音缓存，以及浏览器里的 API Key 与偏好设置。
        </p>
      </Section>

      <Section title="接口信息" icon={Info}>
        <dl className="space-y-2 text-[11.5px]">
          <InfoRow label="Base URL" value={API_BASE_URL} />
          <InfoRow label="ASR" value={MODELS.asr} />
          <InfoRow label="LLM" value={MODELS.llm} />
          <InfoRow label="TTS" value={MODELS.tts} />
        </dl>
        <p className="mt-3 text-[11px] leading-5 text-muted">
          ASR 请求会把录音转成 16kHz 单声道 WAV，再以 base64 发送。若官方格式调整，请以 MiMo 文档为准。
        </p>
      </Section>

      <ConfirmDialog
        open={confirmOpen}
        title="清除所有本地数据？"
        description="练习记录、语音缓存、话题、API Key 和偏好设置都会被删除，且无法恢复。"
        confirmLabel={clearing ? '清除中…' : '确认清除'}
        destructive
        onConfirm={() => void clearData()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: typeof Sun;
  children: ReactNode;
}) {
  return (
    <section className="mb-3.5 rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-start gap-2">
        {Icon && (
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon className="size-3.5" />
          </span>
        )}
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-[11px] leading-5 text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function UsageCard({ label, usage }: { label: string; usage: UsageRecord }) {
  return (
    <div className="rounded-2xl border border-line bg-surface2 px-3 py-2.5">
      <p className="text-[10.5px] text-muted">{label}</p>
      <p className="mt-1 text-[18px] font-semibold leading-none text-ink">
        {estimateTokens(usage)}
        <span className="ml-1 text-[10px] font-normal text-muted">tokens ≈</span>
      </p>
      <p className="mt-1.5 text-[10px] text-muted">{usage.llmTokens + usage.ttsChars > 0 ? '含实际与估算' : '还没有消耗'}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="break-all text-right font-mono text-[10.5px] text-ink">{value}</dd>
    </div>
  );
}
