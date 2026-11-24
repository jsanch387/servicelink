import { ArrowUpIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/shared';
import React, { useLayoutEffect, useRef, useState } from 'react';

import {
  draftById,
  effectiveStatus,
  eveningLines,
  sentConfirmation,
} from '../mock/sampleDay';
import type { AssistantPerson } from '../today/buildAssistantToday';
import type { ActivityEntry, AssistantDraft } from '../types';

const GROUPS = [
  {
    kind: 'review',
    title: 'These customers haven’t left a review',
    subtitle: () => 'Asking usually brings in one or two',
  },
  {
    kind: 'customer',
    title: 'These customers haven’t booked in a while',
    subtitle: () => 'Last visit over 90 days ago',
  },
] as const;

const ASK_SUGGESTIONS = [
  'How much did I make last month?',
  'Who are my top customers?',
  'Which service makes me the most?',
  'Block off Friday afternoon',
] as const;

function groupTitle(group: (typeof GROUPS)[number]): string {
  return group.title;
}

function handledSummary(activity: readonly ActivityEntry[]): string {
  if (activity.length === 0) {
    return 'When messages go out, they’ll show up here.';
  }

  const counts = {
    review: 0,
    rebook: 0,
    reminder: 0,
    other: 0,
  };
  for (const entry of activity) {
    if (entry.topic === 'review') counts.review += 1;
    else if (entry.topic === 'rebook') counts.rebook += 1;
    else if (entry.topic === 'reminder') counts.reminder += 1;
    else counts.other += 1;
  }

  const parts: string[] = [];
  if (counts.reminder > 0) {
    parts.push(
      `${counts.reminder} ${counts.reminder === 1 ? 'reminder' : 'reminders'}`
    );
  }
  if (counts.review > 0) {
    parts.push(
      `${counts.review} ${counts.review === 1 ? 'review request' : 'review requests'}`
    );
  }
  if (counts.rebook > 0) {
    parts.push(
      `${counts.rebook} ${counts.rebook === 1 ? 'check-in' : 'check-ins'}`
    );
  }
  if (counts.other > 0) {
    parts.push(`${counts.other} ${counts.other === 1 ? 'update' : 'updates'}`);
  }
  return parts.join(' · ');
}

const ASK_LINE_HEIGHT = 22;
const ASK_MAX_LINES = 8;

function AskAnythingRail() {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const next = Math.min(
      Math.max(el.scrollHeight, ASK_LINE_HEIGHT),
      ASK_LINE_HEIGHT * ASK_MAX_LINES
    );
    el.style.height = `${next}px`;
    setExpanded(next > ASK_LINE_HEIGHT + 4);
  }, [draft]);

  const sendButton = (
    <button
      type="submit"
      aria-label="Send question"
      disabled={!draft.trim()}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
    >
      <ArrowUpIcon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="w-full min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Ask anything
        </h2>
        <p className="mt-2 text-sm leading-5 text-white/55">
          I know your bookings, customers and money.
        </p>
      </div>

      <div className="mt-10 min-h-0 w-full flex-1 overflow-y-auto">
        <p className="text-sm text-white/55">Try asking</p>
        <div className="mt-3 grid w-full gap-2.5">
          {ASK_SUGGESTIONS.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setDraft(suggestion)}
              className="w-full cursor-pointer rounded-2xl border border-white/[0.12] bg-transparent px-4 py-3.5 text-left text-sm leading-5 text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form
        className={`mt-6 box-border w-full min-w-0 border border-white/[0.08] bg-[#262626] ${
          expanded
            ? 'flex flex-col rounded-[22px] px-3.5 pt-3 pb-2.5'
            : 'flex h-11 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4'
        }`}
        onSubmit={event => {
          event.preventDefault();
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
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask about your business"
          className={`resize-none overflow-y-auto bg-transparent text-[15px] leading-[22px] text-white outline-none placeholder:text-white/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            expanded
              ? 'w-full min-h-[22px] max-h-[176px]'
              : 'min-h-[22px] max-h-[22px] min-w-0 flex-1'
          }`}
        />
        {expanded ? (
          <div className="mt-2 flex items-center justify-end">{sendButton}</div>
        ) : (
          sendButton
        )}
      </form>
    </div>
  );
}

export function MorningMoment({
  reviews,
  checkIns,
  activity,
  onPrepare,
  onOpenActivity,
}: {
  reviews: readonly AssistantPerson[];
  checkIns: readonly AssistantPerson[];
  activity: readonly ActivityEntry[];
  onPrepare: (people: readonly AssistantPerson[]) => void;
  onOpenActivity: () => void;
}) {
  const peopleByKind = {
    review: reviews,
    customer: checkIns,
  };
  const openGroups = GROUPS.map(group => ({
    ...group,
    open: peopleByKind[group.kind],
  })).filter(group => group.open.length > 0);

  const thingCount = openGroups.length;
  const subtitle =
    thingCount === 0
      ? 'Nothing needs a yes from you right now.'
      : `${thingCount === 1 ? 'One thing needs' : `${numberWord(thingCount)} things need`} a yes from you. Nothing sends without it.`;

  return (
    <div className="grid w-full gap-10 lg:-my-10 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-0">
      <div className="grid min-w-0 content-start gap-8 px-4 sm:px-8 lg:py-10 lg:pr-8 lg:pl-12">
        <header>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Assistant
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60 sm:text-base">
            {subtitle}
          </p>
        </header>

        <section className="-mt-2 grid gap-3">
          {openGroups.length > 0 ? (
            <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03]">
              <ul>
                {openGroups.map((group, index) => {
                  const count = group.open.length;
                  return (
                    <li
                      key={group.kind}
                      className={
                        index > 0 ? 'border-t border-white/[0.06]' : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onPrepare(group.open)}
                        className="flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.04] sm:gap-5 sm:px-5 sm:py-5"
                      >
                        <span className="w-8 shrink-0 text-2xl font-semibold tracking-tight text-white tabular-nums sm:w-10 sm:text-3xl">
                          {count}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold tracking-tight text-white sm:text-base">
                            {groupTitle(group)}
                          </span>
                          <span className="mt-1 block text-sm text-white/60">
                            {group.subtitle(group.open)}
                          </span>
                        </span>
                        <ChevronRightIcon
                          className="h-5 w-5 shrink-0 text-white/40"
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/60">
              Nothing needs you this morning.
            </p>
          )}

          <button
            type="button"
            onClick={onOpenActivity}
            className="flex w-full cursor-pointer items-center gap-4 rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-left transition-colors hover:bg-white/[0.04] sm:gap-5 sm:px-5 sm:py-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold tracking-tight text-white sm:text-base">
                Handled for you this week
              </span>
              <span className="mt-1 block text-sm text-white/60">
                {handledSummary(activity)}
              </span>
            </span>
            <ChevronRightIcon
              className="h-5 w-5 shrink-0 text-white/40"
              aria-hidden
            />
          </button>
        </section>
      </div>

      <aside
        id="assistant-rail"
        className="flex w-full min-w-0 flex-col border-white/[0.08] px-4 pt-6 sm:px-8 lg:h-full lg:min-h-full lg:border-l lg:px-5 lg:pt-4 lg:pb-10"
      >
        <AskAnythingRail />
      </aside>
    </div>
  );
}

function numberWord(count: number): string {
  const words = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
  ];
  return words[count] ?? String(count);
}

export function SentMoment({
  drafts,
  onContinue,
}: {
  drafts: readonly AssistantDraft[];
  onContinue: () => void;
}) {
  return (
    <div className="assistant-rise">
      <h2 className="text-sm font-medium text-zinc-400">Sent</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
        {sentConfirmation(drafts, 'sent')}
      </p>
      <div className="mt-8">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onContinue}
        >
          See the rest of the day
        </Button>
      </div>
    </div>
  );
}

export function MiddayMoment({
  drafts,
  onEvening,
}: {
  drafts: readonly AssistantDraft[];
  onEvening: () => void;
}) {
  const sarahSent =
    effectiveStatus(draftById(drafts, 'sarah-rebook'), 'midday') === 'sent';

  return (
    <div className="assistant-rise">
      <h2 className="text-sm font-medium text-zinc-400">
        {sarahSent ? 'Sarah booked' : 'Nothing new from Sarah'}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
        {sarahSent
          ? 'Thursday at 2:00 PM. That came from the note you sent this morning.'
          : 'Sarah’s note never went out, so there’s nothing new to celebrate.'}
      </p>
      <div className="mt-8">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onEvening}
        >
          End of day
        </Button>
      </div>
    </div>
  );
}

export function EveningMoment({
  drafts,
}: {
  drafts: readonly AssistantDraft[];
}) {
  const lines = eveningLines(drafts, 'evening');

  return (
    <div>
      <div className="assistant-rise">
        <h2 className="text-sm font-medium text-zinc-400">Today</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          How the day turned out.
        </p>
      </div>
      <ul className="mt-4 divide-y divide-white/[0.06]">
        {lines.map(line => (
          <li key={line} className="py-3 text-sm leading-6 text-zinc-300">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
