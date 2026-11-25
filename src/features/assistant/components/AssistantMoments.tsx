import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/shared';
import { PaymentsProTeaserBanner } from '@/features/payments/free-payment-preview';
import React, { useState } from 'react';

import { AskAnythingRail } from '../chat/components/AskAnythingRail';
import {
  draftById,
  effectiveStatus,
  eveningLines,
  sentConfirmation,
} from '../mock/sampleDay';
import type { AssistantChatUsage } from '../server/assistantUsageMonth';
import type { AssistantPerson } from '../today/buildAssistantToday';
import type { ActivityEntry, AssistantDraft } from '../types';
import { RecentActivity } from './RecentActivity';

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

function groupTitle(group: (typeof GROUPS)[number]): string {
  return group.title;
}

export function MorningMoment({
  reviews,
  checkIns,
  activity,
  chatUsage,
  unlocked = true,
  onPrepare,
  onOpenActivity,
  onRequestUpgrade,
}: {
  reviews: readonly AssistantPerson[];
  checkIns: readonly AssistantPerson[];
  activity: readonly ActivityEntry[];
  chatUsage: AssistantChatUsage;
  /** When false, prepare/chat actions open the Pro teaser instead. */
  unlocked?: boolean;
  onPrepare: (people: readonly AssistantPerson[]) => void;
  onOpenActivity: () => void;
  onRequestUpgrade?: () => void;
}) {
  const [mobileAskOpen, setMobileAskOpen] = useState(false);
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
      <div
        className={`min-w-0 content-start gap-8 px-4 pb-28 sm:px-8 lg:grid lg:py-10 lg:pr-8 lg:pb-0 lg:pl-12 ${
          mobileAskOpen ? 'hidden lg:grid' : 'grid'
        }`}
      >
        {!unlocked ? (
          <PaymentsProTeaserBanner
            title="Assistant is included with Pro"
            description="See who needs a review or check-in, send texts with your approval, and ask about your shop."
          />
        ) : null}

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
                        onClick={() => {
                          if (!unlocked) {
                            onRequestUpgrade?.();
                            return;
                          }
                          onPrepare(group.open);
                        }}
                        aria-label={
                          unlocked
                            ? undefined
                            : `${groupTitle(group)}: Pro feature — learn more`
                        }
                        title={unlocked ? undefined : 'Pro feature'}
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
                        {unlocked ? (
                          <ChevronRightIcon
                            className="h-5 w-5 shrink-0 text-white/40"
                            aria-hidden
                          />
                        ) : (
                          <LockClosedIcon
                            className="h-5 w-5 shrink-0 text-white/40"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <RecentActivity entries={activity} onViewAll={onOpenActivity} />
        </section>
      </div>

      {!mobileAskOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[max(2.25rem,calc(env(safe-area-inset-bottom)+1.25rem))] lg:hidden">
          <button
            type="button"
            onClick={() => {
              if (!unlocked) {
                onRequestUpgrade?.();
                return;
              }
              setMobileAskOpen(true);
            }}
            aria-label={
              unlocked
                ? 'Ask anything'
                : 'Ask anything: Pro feature — learn more'
            }
            className="pointer-events-auto flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold tracking-tight text-black shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-zinc-100"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
            Ask anything
          </button>
        </div>
      ) : null}

      <aside
        id="assistant-rail"
        className={`min-h-0 w-full min-w-0 flex-col overflow-hidden border-white/[0.08] px-4 sm:px-8 lg:flex lg:h-full lg:max-h-[calc(100dvh-4rem)] lg:border-l lg:px-5 lg:pt-4 lg:pb-10 ${
          mobileAskOpen
            ? 'flex h-[calc(100dvh-5.5rem)] pt-2 pb-4'
            : 'hidden pt-6'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileAskOpen(false)}
          className="mb-3 inline-flex w-fit cursor-pointer items-center gap-0.5 text-[14px] font-medium text-[#9A9A9A] transition-colors hover:text-white lg:hidden"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Assistant
        </button>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AskAnythingRail
            unlocked={unlocked}
            chatUsage={chatUsage}
            onRequestUpgrade={onRequestUpgrade}
          />
        </div>
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
