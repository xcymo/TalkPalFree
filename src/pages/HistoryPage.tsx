import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, History as HistoryIcon, Mic } from 'lucide-react';
import type { SessionRecord } from '../types';
import { db } from '../lib/db';
import { formatDateLabel, formatTime } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { SentenceCompare } from '../components/SentenceCompare';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { ReplyCard } from '../components/ReplyCard';
import { TopicFilter } from '../components/TopicFilter';
import { useStickyBleed } from '../hooks/useStickyBleed';
import type { Route } from '../hooks/useHashRoute';

interface HistoryPageProps {
  navigate: (route: Route) => void;
}

interface TopicGroup {
  key: string;
  dateKey: string;
  topicTitleEn: string;
  topicTitleZh: string;
  sessions: SessionRecord[];
}

export function HistoryPage({ navigate }: HistoryPageProps) {
  const [topicFilter, setTopicFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const stickyRef = useStickyBleed<HTMLDivElement>();

  const sessions =
    useLiveQuery(() => db.sessions.orderBy('createdAt').reverse().toArray(), []) ?? [];

  const filtered =
    topicFilter === 'all'
      ? sessions
      : sessions.filter((session) => session.topicTitleEn === topicFilter);

  const topicCountMap = new Map<string, number>();
  for (const session of sessions) {
    topicCountMap.set(session.topicTitleEn, (topicCountMap.get(session.topicTitleEn) ?? 0) + 1);
  }
  const topicOptions = Array.from(topicCountMap.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const groupMap = new Map<string, TopicGroup>();
  for (const session of filtered) {
    const key = `${session.dateKey}::${session.topicTitleEn}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groupMap.set(key, {
        key,
        dateKey: session.dateKey,
        topicTitleEn: session.topicTitleEn,
        topicTitleZh: session.topicTitleZh,
        sessions: [session],
      });
    }
  }

  // 同一话题的多轮对话合并成一条记录，轮次按时间正序展示
  const groups = Array.from(groupMap.values()).map((group) => ({
    ...group,
    sessions: [...group.sessions].sort((a, b) => a.createdAt - b.createdAt),
  }));

  const dateGroups = new Map<string, TopicGroup[]>();
  for (const group of groups) {
    const list = dateGroups.get(group.dateKey) ?? [];
    list.push(group);
    dateGroups.set(group.dateKey, list);
  }

  const topicCount = new Set(sessions.map((session) => `${session.dateKey}::${session.topicTitleEn}`))
    .size;

  return (
    <div>
      <PageHeader
        title="历史"
        subtitle={
          sessions.length > 0
            ? `累计 ${sessions.length} 轮 · ${topicCount} 个话题`
            : '你的每一次开口都会留在这里'
        }
      />

      {sessions.length > 0 && (
        <div
          ref={stickyRef}
          className="fade-header sticky-safe sticky top-0 z-30 -mx-4 transform-gpu px-4 pb-3 pt-2"
        >
          <TopicFilter
            value={topicFilter}
            options={topicOptions}
            onChange={(value) => {
              setTopicFilter(value);
              setExpandedKey(null);
            }}
          />
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="还没有练习记录"
          description="完成第一轮口语练习后，同一话题的多轮对话会按日期合并在一条记录里。"
          action={
            <button
              type="button"
              onClick={() => navigate('practice')}
              className="min-h-[46px] rounded-2xl bg-brand px-6 text-[14px] font-semibold text-white dark:text-[#1a1830]"
            >
              去练习
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="这个话题还没有记录"
          description="换一个话题筛选，或者现在就练一轮。"
          action={
            <button
              type="button"
              onClick={() => setTopicFilter('all')}
              className="min-h-[46px] rounded-2xl border border-line bg-surface px-6 text-[13px] font-medium text-ink"
            >
              查看全部
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {Array.from(dateGroups.entries()).map(([dateKey, items]) => {
            const roundCount = items.reduce((total, group) => total + group.sessions.length, 0);
            return (
              <section key={dateKey}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-[12px] font-semibold text-ink">{formatDateLabel(dateKey)}</h2>
                  <span className="text-[10.5px] text-muted">
                    {items.length} 个话题 · {roundCount} 轮
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((group) => {
                    const expanded = expandedKey === group.key;
                    const last = group.sessions[group.sessions.length - 1];
                    const correctionCount = group.sessions.reduce(
                      (total, session) => total + session.corrections.length,
                      0,
                    );

                    return (
                      <article
                        key={group.key}
                        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedKey(expanded ? null : group.key)}
                          aria-expanded={expanded}
                          className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-surface2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-ink">
                                {group.topicTitleZh}
                              </span>
                              <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-semibold text-brand">
                                {group.sessions.length} 轮
                              </span>
                              {correctionCount > 0 ? (
                                <span className="shrink-0 rounded-full bg-surface2 px-1.5 py-0.5 text-[9.5px] font-medium text-muted">
                                  {correctionCount} 处纠正
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                                  很自然
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-[11.5px] text-muted">
                              {group.topicTitleEn}
                            </span>
                            <span className="mt-1 block truncate text-[11px] text-muted">
                              {last.replyText}
                            </span>
                          </span>
                          <ChevronDown
                            className={`mt-0.5 size-4 shrink-0 text-muted transition-transform ${
                              expanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expanded && (
                          <div className="space-y-4 border-t border-line px-4 py-3.5 animate-fade-up">
                            {group.sessions.map((session, index) => (
                              <div
                                key={session.id ?? index}
                                className={index > 0 ? 'border-t border-line pt-4' : undefined}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                                    Round {index + 1} · {formatTime(session.createdAt)}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                    {session.corrections.length > 0
                                      ? `${session.corrections.length} 处纠正`
                                      : '这句话很自然'}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <SentenceCompare
                                    compact
                                    userText={session.userText}
                                    optimizedSentence={session.optimizedFullSentence}
                                  />
                                </div>

                                {session.corrections.length > 0 && (
                                  <div className="mt-3">
                                    <CorrectionsPanel corrections={session.corrections} compact />
                                  </div>
                                )}

                                <div className="mt-3">
                                  <ReplyCard
                                    text={session.replyText}
                                    translation={session.replyTranslationZh}
                                    voice={session.voice}
                                    compact
                                    hideAvatar
                                    collapsibleTranslation
                                    label="AI 回复"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
