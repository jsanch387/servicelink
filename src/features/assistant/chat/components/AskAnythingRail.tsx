'use client';

import { ASSISTANT_API } from '@/features/assistant/constants/assistantApiPaths';
import type { AssistantChatUsage } from '@/features/assistant/server/assistantUsageMonth';
import { useChat } from '@ai-sdk/react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { DefaultChatTransport } from 'ai';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { AssistantReplyText } from './AssistantReplyText';
import { ChatTurnRing } from './ChatTurnRing';
import { ThinkingIndicator } from './ThinkingIndicator';

/** Only suggest questions live tools can answer — never tease gaps. */
const ASK_SUGGESTIONS = [
  'How much did I make last month?',
  'What’s on my schedule today?',
  'Who should I follow up with?',
  'How can I improve my service menu?',
] as const;

const ASK_LINE_HEIGHT = 22;
const ASK_MAX_LINES = 8;

function messageText(
  parts: readonly { type: string; text?: string }[]
): string {
  return parts
    .filter(part => part.type === 'text' && typeof part.text === 'string')
    .map(part => part.text as string)
    .join('');
}

function formatThreadStamp(date: Date): string {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return `Today ${time}`;
}

function bumpChatUsage(current: AssistantChatUsage): AssistantChatUsage {
  const used = Math.min(current.limit, current.used + 1);
  return {
    ...current,
    used,
    remaining: Math.max(0, current.limit - used),
  };
}

export function AskAnythingRail({
  unlocked = true,
  chatUsage: initialChatUsage,
  onRequestUpgrade,
}: {
  unlocked?: boolean;
  chatUsage: AssistantChatUsage;
  onRequestUpgrade?: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [chatUsage, setChatUsage] = useState(initialChatUsage);
  const [threadStartedAt] = useState(() => new Date());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: ASSISTANT_API.CHAT,
        credentials: 'include',
      }),
    []
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
  });

  const busy = status === 'submitted' || status === 'streaming';
  const atLimit = unlocked && chatUsage.remaining <= 0;
  const lastMessage = messages[messages.length - 1];
  const waitingForReply =
    status === 'submitted' ||
    (status === 'streaming' &&
      (!lastMessage ||
        lastMessage.role !== 'assistant' ||
        !messageText(lastMessage.parts)));

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const next = Math.min(
      Math.max(el.scrollHeight, ASK_LINE_HEIGHT),
      ASK_LINE_HEIGHT * ASK_MAX_LINES
    );
    el.style.height = `${next}px`;
  }, [draft]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages, status]);

  async function submitQuestion(text: string) {
    if (!unlocked) {
      onRequestUpgrade?.();
      return;
    }
    if (atLimit) return;
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    setDraft('');
    setChatUsage(bumpChatUsage);
    await sendMessage({ text: trimmed });
  }

  const canSubmit = unlocked && !atLimit && Boolean(draft.trim()) && !busy;

  const composerActions = (
    <div className="flex items-center justify-end gap-2.5">
      <ChatTurnRing usage={chatUsage} />
      <button
        type="submit"
        aria-label={
          !unlocked
            ? 'Ask: Pro feature — learn more'
            : atLimit
              ? 'Monthly Ask limit reached'
              : 'Send question'
        }
        disabled={unlocked ? !canSubmit : false}
        title={
          !unlocked
            ? 'Pro feature'
            : atLimit
              ? `${chatUsage.used} of ${chatUsage.limit} questions this month`
              : undefined
        }
        className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ArrowUpIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );

  const hasThread = messages.length > 0;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      {!hasThread ? (
        <div className="w-full min-w-0 shrink-0">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Ask anything
          </h2>
          <p className="mt-2 text-sm leading-5 text-white/55">
            Ask about money, schedule, customers, follow-ups, or your menu.
          </p>
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className={`scrollbar-hide min-h-0 w-full flex-1 overflow-y-auto overscroll-contain ${
          hasThread ? 'mt-1' : 'mt-8'
        }`}
      >
        {!hasThread ? (
          <>
            <p className="text-sm text-white/55">Try asking</p>
            <div className="mt-3 grid w-full gap-2.5">
              {ASK_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={unlocked ? busy || atLimit : false}
                  onClick={() => {
                    if (!unlocked) {
                      onRequestUpgrade?.();
                      return;
                    }
                    void submitQuestion(suggestion);
                  }}
                  title={unlocked ? undefined : 'Pro feature'}
                  className="w-full cursor-pointer rounded-2xl border border-white/[0.12] bg-transparent px-4 py-3.5 text-left text-sm leading-5 text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-5 pb-2">
            <p className="py-1 text-center text-[12px] leading-4 text-white/40">
              {formatThreadStamp(threadStartedAt)}
            </p>
            <ul className="flex flex-col gap-5">
              {messages.map(message => {
                const text = messageText(message.parts);
                if (!text) return null;
                const isUser = message.role === 'user';
                return (
                  <li
                    key={message.id}
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {isUser ? (
                      <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-white px-4 py-2.5 text-[15px] leading-[22px] whitespace-pre-wrap text-black">
                        {text}
                      </div>
                    ) : (
                      <div className="w-full min-w-0">
                        <AssistantReplyText text={text} />
                      </div>
                    )}
                  </li>
                );
              })}
              {waitingForReply ? (
                <li>
                  <ThinkingIndicator />
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error.message?.trim() || 'Couldn’t get a reply. Try again.'}
        </p>
      ) : atLimit ? (
        <p className="mt-3 text-sm text-white/55" role="status">
          You’ve used all Ask questions for this month.
        </p>
      ) : null}

      <form
        className="mt-4 flex w-full min-w-0 shrink-0 flex-col rounded-[18px] border border-white/[0.08] bg-[#262626] px-3.5 pt-3 pb-2.5"
        onSubmit={event => {
          event.preventDefault();
          if (atLimit) return;
          void submitQuestion(draft);
        }}
      >
        <label className="sr-only" htmlFor="assistant-ask">
          Ask about your business
        </label>
        <textarea
          id="assistant-ask"
          ref={textareaRef}
          rows={1}
          value={draft}
          disabled={busy || atLimit}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask about your business"
          className="w-full min-h-[22px] max-h-[176px] resize-none overflow-y-auto bg-transparent text-[15px] leading-[22px] text-white outline-none placeholder:text-white/40 [scrollbar-width:none] disabled:cursor-not-allowed [&::-webkit-scrollbar]:hidden"
        />
        <div className="mt-2.5">{composerActions}</div>
      </form>
    </div>
  );
}
