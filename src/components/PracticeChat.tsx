import { useState } from 'react';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import type { PracticeStage, SessionRecord } from '../types';
import { classNames } from '../lib/utils';
import { ReplyCard } from './ReplyCard';
import { CorrectionList } from './CorrectionList';

interface PracticeChatProps {
  rounds: SessionRecord[];
  autoPlayKey: number | null;
  onAutoPlayed: () => void;
  pendingUserText: string | null;
  stage: PracticeStage;
}

/** 连续的对话记录：你的消息靠右，AI 回复靠左，不做轮次分组。 */
export function PracticeChat({
  rounds,
  autoPlayKey,
  onAutoPlayed,
  pendingUserText,
  stage,
}: PracticeChatProps) {
  return (
    <div className="space-y-3">
      {rounds.map((round) => (
        <ChatExchange
          key={round.id ?? round.createdAt}
          round={round}
          autoPlay={round.createdAt === autoPlayKey}
          onAutoPlayed={onAutoPlayed}
        />
      ))}

      {stage !== 'idle' && (
        <>
          {pendingUserText ? (
            <div className="flex justify-end animate-fade-up">
              <div className="min-w-0 max-w-[82%] rounded-2xl rounded-br-md bg-brand-soft px-3.5 py-2.5">
                <p className="font-serif text-[16.5px] leading-7 text-ink">{pendingUserText}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end animate-fade-up">
              <div className="flex min-h-[48px] items-center gap-2 rounded-2xl rounded-br-md bg-brand-soft px-3.5 py-2.5">
                <span className="h-2.5 w-14 animate-pulse rounded-full bg-brand/25" />
                <span className="h-2.5 w-20 animate-pulse rounded-full bg-brand/20" />
              </div>
            </div>
          )}

          {stage === 'thinking' && (
            <div className="flex justify-start animate-fade-up">
              <div
                role="status"
                aria-label="AI 正在回复"
                className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-4 shadow-card"
              >
                <span className="size-1.5 rounded-full bg-muted animate-typing-dot" />
                <span
                  className="size-1.5 rounded-full bg-muted animate-typing-dot"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="size-1.5 rounded-full bg-muted animate-typing-dot"
                  style={{ animationDelay: '0.3s' }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ChatExchangeProps {
  round: SessionRecord;
  autoPlay: boolean;
  onAutoPlayed: () => void;
}

function ChatExchange({ round, autoPlay, onAutoPlayed }: ChatExchangeProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasCorrections = round.corrections.length > 0;

  return (
    <>
      <div className="flex items-center justify-end gap-2 animate-fade-up">
        <button
          type="button"
          onClick={() => setDetailsOpen((value) => !value)}
          aria-expanded={detailsOpen}
          aria-label={
            hasCorrections
              ? `查看 ${round.corrections.length} 处纠错和更自然的说法`
              : '查看更自然的说法'
          }
          className={classNames(
            'flex size-9 shrink-0 items-center justify-center rounded-full border transition active:scale-95',
            hasCorrections
              ? 'border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300'
              : 'border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300',
            detailsOpen && 'shadow-card',
          )}
        >
          {hasCorrections ? (
            <AlertCircle className="size-4" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
        </button>

        <div className="min-w-0 max-w-[82%] rounded-2xl rounded-br-md bg-brand-soft px-3.5 py-2.5">
          <p className="font-serif text-[16.5px] leading-7 text-ink">{round.userText}</p>
        </div>
      </div>

      {detailsOpen && (
        <div className="space-y-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 animate-fade-up">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              <Sparkles className="size-3" />
              更自然的说法
            </p>
            <p className="mt-1 font-serif text-[15px] leading-6 text-ink">
              {round.optimizedFullSentence}
            </p>
          </div>
          <div className="border-t border-line pt-2.5">
            <CorrectionList corrections={round.corrections} />
          </div>
        </div>
      )}

      <div className="flex justify-start animate-fade-up">
        <div className="w-fit min-w-0 max-w-[94%]">
          <ReplyCard
            text={round.replyText}
            translation={round.replyTranslationZh}
            voice={round.voice}
            hideAvatar
            collapsibleTranslation
            autoPlay={autoPlay}
            onAutoPlayed={onAutoPlayed}
          />
        </div>
      </div>
    </>
  );
}
