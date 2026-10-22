import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/shared';
import React, { useState } from 'react';

import {
  draftById,
  effectiveStatus,
  eveningLines,
  sentConfirmation,
} from '../mock/sampleDay';
import {
  assistantBrief,
  type AssistantBrief,
  type AssistantPerson,
} from '../today/buildAssistantToday';
import type { ActivityEntry, AssistantDraft } from '../types';
import { AssistantMark } from './AssistantMark';
import { DraftMessageCard } from './DraftMessageCard';
import { RecentActivity } from './RecentActivity';

const GROUPS = [
  {
    kind: 'quote',
    label: 'Quotes',
    skipLabel: 'Quotes',
    detail: 'Sent, and no reply yet',
    preview:
      'Hey {first_name}, just checking in on the quote I sent. Happy to hold a spot if you want it.',
    title: (count: number, name: string) =>
      count === 1 ? `Follow up with ${name}` : `Follow up on ${count} quotes`,
  },
  {
    kind: 'invoice',
    label: 'Invoices',
    skipLabel: 'Invoices',
    detail: 'Still unpaid',
    preview:
      'Hey {first_name}, your invoice is still open whenever you’re ready to pay.',
    title: (count: number, name: string) =>
      count === 1 ? `Collect from ${name}` : `Collect ${count} invoices`,
  },
  {
    kind: 'review',
    label: 'Reviews',
    skipLabel: 'Reviews',
    detail: 'No review yet',
    preview:
      'Hi {first_name}, thanks again for trusting us. A quick review would mean a lot. [review link]',
    title: (count: number, name: string) =>
      count === 1 ? `Ask ${name} for a review` : `Ask for ${count} reviews`,
  },
  {
    kind: 'customer',
    label: 'Check-in',
    skipLabel: 'Booking messages',
    detail: 'It’s been a while since the last visit',
    preview:
      'Hey {first_name}, it’s been a while since your last detail. I can hold a spot this week. [booking link]',
    title: (count: number, name: string) =>
      count === 1 ? `Check in with ${name}` : `Check in with ${count} regulars`,
  },
] as const;

const compactButtonClass =
  '!h-7 !min-h-0 !rounded-lg !px-2.5 !py-0 !text-[13px] !font-medium !leading-none';

const NAME_PREVIEW = 3;

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function AssistantRail({ brief }: { brief: AssistantBrief }) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid gap-3">
        <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3 text-sm leading-6 text-zinc-200">
          {brief.intro.map(line => (
            <p key={line} className="mt-3 first:mt-0">
              {line}
            </p>
          ))}
        </div>
        {brief.quotes ? (
          <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3 text-sm leading-6 text-zinc-200">
            <p>{brief.quotes}</p>
          </div>
        ) : null}
        {brief.invoices ? (
          <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3 text-sm leading-6 text-zinc-200">
            <p>{brief.invoices}</p>
          </div>
        ) : null}
        {brief.review ? (
          <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3 text-sm leading-6 text-zinc-200">
            <p>{brief.review}</p>
          </div>
        ) : null}
        {brief.checkIn ? (
          <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3 text-sm leading-6 text-zinc-200">
            <p>{brief.checkIn}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MorningMoment({
  quotes,
  invoices,
  reviews,
  checkIns,
  activity,
  onPrepare,
  onOpenActivity,
}: {
  quotes: readonly AssistantPerson[];
  invoices: readonly AssistantPerson[];
  reviews: readonly AssistantPerson[];
  checkIns: readonly AssistantPerson[];
  activity: readonly ActivityEntry[];
  onPrepare: (people: readonly AssistantPerson[]) => void;
  onOpenActivity: () => void;
}) {
  const [skipped, setSkipped] = useState<string[]>([]);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const peopleByKind = {
    quote: quotes,
    invoice: invoices,
    review: reviews,
    customer: checkIns,
  };
  const groups = GROUPS.map(group => {
    const items = peopleByKind[group.kind];
    const open = items.filter(person => !skipped.includes(person.id));
    return {
      ...group,
      items,
      open,
      sendLabel: open.length === 1 ? 'Send' : `Send to ${open.length}`,
    };
  });
  const openGroups = groups.filter(group => group.open.length > 0);
  const skippedGroups = groups.filter(
    group => group.items.length > 0 && group.open.length === 0
  );

  return (
    <div className="flex w-full flex-col gap-6 lg:block">
      <div
        className={`assistant-rail-motion grid min-w-0 content-start gap-8 transition-[margin] ${
          railCollapsed ? 'lg:mr-10' : 'lg:mr-[21rem]'
        }`}
      >
        <header>
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Good morning
          </h2>
        </header>

        <section className="-mt-4">
          {openGroups.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {openGroups.map(group => {
                const count = group.open.length;
                const prepare = () => onPrepare(group.open);

                return (
                  <article
                    key={group.kind}
                    className="flex flex-col rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-white">
                        {group.label}
                      </span>
                      <span className="text-xs text-white/60">
                        SMS · {count} {count === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <h4 className="mt-4 text-sm font-medium text-white">
                      {group.title(count, group.open[0]?.firstName ?? '')}
                    </h4>
                    <p className="mt-1 text-sm text-white/60">{group.detail}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.open.slice(0, NAME_PREVIEW).map(person => (
                        <span
                          key={person.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] pr-2.5 pl-1"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-medium text-white">
                            {initials(person.firstName)}
                          </span>
                          <span className="text-xs font-medium text-white">
                            {person.firstName}
                          </span>
                        </span>
                      ))}
                      {count > NAME_PREVIEW ? (
                        <span className="inline-flex h-8 items-center rounded-full bg-white/[0.06] px-2.5 text-xs font-medium text-white/60">
                          + {count - NAME_PREVIEW} more
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 rounded-[10px] bg-black/40 px-3 py-3 text-sm leading-5 text-white/60">
                      {group.preview}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        aria-label={`Skip ${group.skipLabel.toLowerCase()}`}
                        onClick={() =>
                          setSkipped(current => [
                            ...current,
                            ...group.open.map(person => person.id),
                          ])
                        }
                        className="inline-flex h-7 cursor-pointer items-center rounded-lg px-2 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Skip
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="xs"
                          className={compactButtonClass}
                          aria-label={`Edit ${group.label.toLowerCase()}`}
                          onClick={prepare}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          className={compactButtonClass}
                          onClick={prepare}
                        >
                          {group.sendLabel}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/60">
              Nothing needs you this morning.
            </p>
          )}
          {skippedGroups.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {skippedGroups.map(group => (
                <div key={group.kind} className="flex items-center gap-3">
                  <p className="text-sm text-zinc-500">
                    {group.skipLabel} skipped
                  </p>
                  <Button
                    variant="ghost"
                    size="xs"
                    className={compactButtonClass}
                    onClick={() =>
                      setSkipped(current =>
                        current.filter(
                          id => !group.items.some(item => item.id === id)
                        )
                      )
                    }
                  >
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
        <RecentActivity entries={activity} onViewAll={onOpenActivity} />
      </div>
      <aside
        id="assistant-rail"
        className={`assistant-rail-motion relative mt-6 flex w-full flex-col overflow-hidden rounded-3xl bg-white/[0.04] lg:fixed lg:top-[5.25rem] lg:right-4 lg:bottom-4 lg:z-20 lg:mt-0 ${
          railCollapsed
            ? 'p-4 lg:w-14 lg:items-center lg:px-1.5 lg:py-3'
            : 'p-4 lg:w-[22rem] lg:p-5'
        }`}
      >
        <div
          className={`flex min-w-0 items-center gap-2.5 ${
            railCollapsed
              ? 'lg:h-full lg:w-full lg:flex-col lg:justify-between'
              : ''
          }`}
        >
          <AssistantMark size="md" />
          <p
            className={`min-w-0 flex-1 truncate text-sm font-medium text-white ${
              railCollapsed ? 'lg:sr-only' : ''
            }`}
          >
            Assistant
          </p>
          <IconButton
            icon={railCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            onClick={() => setRailCollapsed(current => !current)}
            variant="ghost"
            size="sm"
            className="shrink-0 !rounded-[10px] text-white hover:text-white max-lg:!hidden lg:!inline-flex"
            aria-label={
              railCollapsed ? 'Expand assistant' : 'Collapse assistant'
            }
            aria-expanded={!railCollapsed}
            aria-controls="assistant-rail"
            title={railCollapsed ? 'Expand assistant' : 'Collapse assistant'}
          />
        </div>
        <div
          className={`mt-4 min-h-0 flex-1 overflow-hidden ${
            railCollapsed ? 'lg:hidden' : ''
          }`}
        >
          <AssistantRail
            brief={assistantBrief({
              quotes: quotes.filter(person => !skipped.includes(person.id)),
              invoices: invoices.filter(person => !skipped.includes(person.id)),
              reviews: reviews.filter(person => !skipped.includes(person.id)),
              checkIns: checkIns.filter(person => !skipped.includes(person.id)),
            })}
          />
        </div>
      </aside>
    </div>
  );
}

export function PrepareMoment({
  drafts,
  onBack,
  onBodyChange,
  onSend,
  onSkip,
  onUndo,
  onSendBoth,
}: {
  drafts: readonly AssistantDraft[];
  onBack: () => void;
  onBodyChange: (id: AssistantDraft['id'], body: string) => void;
  onSend: (id: AssistantDraft['id']) => void;
  onSkip: (id: AssistantDraft['id']) => void;
  onUndo: (id: AssistantDraft['id']) => void;
  onSendBoth: () => void;
}) {
  const readyCount = drafts.filter(draft => draft.status === 'ready').length;

  return (
    <div className="-mt-2 w-full sm:-mt-4">
      <button
        type="button"
        onClick={onBack}
        className="assistant-rise mb-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        Back
      </button>
      <div className="assistant-rise flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <AssistantMark size="md" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-white">
              {drafts.length === 1 ? '1 message' : `${drafts.length} messages`}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Make any changes if you want.
            </p>
          </div>
        </div>
        {readyCount > 1 ? (
          <Button variant="primary" size="xs" onClick={onSendBoth}>
            {readyCount === 2 ? 'Send both' : 'Send all'}
          </Button>
        ) : null}
      </div>
      <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className={`assistant-rise assistant-delay-${index + 1} h-full`}
          >
            <DraftMessageCard
              draft={draft}
              onBodyChange={body => onBodyChange(draft.id, body)}
              onSend={() => onSend(draft.id)}
              onSkip={() => onSkip(draft.id)}
              onUndo={() => onUndo(draft.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
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
