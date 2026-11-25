'use client';

import { Modal, toast } from '@/components/shared';
import React, { useMemo, useState } from 'react';

import './assistant.css';

import type { AssistantDecisionResponse } from '../api/types';
import { ASSISTANT_API } from '../constants/assistantApiPaths';
import { filterActivity } from '../mock/sampleDay';
import type { AssistantSendItemResult } from '../server/applyAssistantDecisions';
import type {
  AssistantChatUsage,
  AssistantTextUsage,
} from '../server/assistantUsageMonth';
import type {
  AssistantToday,
  AssistantPerson,
} from '../today/buildAssistantToday';
import type {
  ActivityFilter,
  AssistantDraft,
  AssistantView,
  DayMoment,
} from '../types';
import { ActivityLog } from './ActivityLog';
import {
  EveningMoment,
  MiddayMoment,
  MorningMoment,
  SentMoment,
} from './AssistantMoments';
import { AssistantProTeaserModalBody } from './AssistantProTeaserModalBody';
import { AssistantShell } from './AssistantShell';
import { PrepareMoment } from './PrepareMoment';

function successDraftIds(
  drafts: readonly AssistantDraft[],
  requestedIds: readonly string[],
  results: readonly AssistantSendItemResult[] | undefined
): string[] {
  const idSet = new Set(requestedIds);
  if (!results || results.length === 0) {
    return drafts
      .filter(draft => draft.status === 'ready' && idSet.has(draft.id))
      .map(draft => draft.id);
  }

  const okKeys = new Set(
    results
      .filter(item => item.ok)
      .map(item => `${item.customerId}:${item.subject}`)
  );

  return drafts
    .filter(
      draft =>
        draft.status === 'ready' &&
        idSet.has(draft.id) &&
        draft.subject &&
        okKeys.has(`${draft.customerId}:${draft.subject}`)
    )
    .map(draft => draft.id);
}

function summarizeSendFailures(
  failed: readonly AssistantSendItemResult[]
): string {
  const reasons = new Set(
    failed.map(item => item.reason).filter((reason): reason is string => Boolean(reason))
  );
  const hint = [...reasons]
    .map(reason => {
      switch (reason) {
        case 'no_phone':
          return 'no phone';
        case 'sms_opt_out':
        case 'carrier_opt_out':
          return 'opted out';
        case 'invalid_number':
          return 'invalid number';
        case 'not_configured':
        case 'not_eligible':
          return 'SMS not available';
        case 'limit_reached':
          return 'monthly limit';
        case 'review_link_failed':
        case 'no_booking':
          return 'review link';
        case 'already_reviewed':
          return 'already reviewed';
        default:
          return 'send error';
      }
    })
    .slice(0, 3)
    .join(' / ');

  return failed.length === 1
    ? `1 couldn’t send${hint ? ` — ${hint}` : ''}`
    : `${failed.length} couldn’t send${hint ? ` — ${hint}` : ''}`;
}

function draftsFromPeople(
  people: readonly AssistantPerson[]
): AssistantDraft[] {
  return people.map(person => ({
    id: person.id,
    label:
      person.subject === 'review_followup'
        ? 'Review follow-up'
        : person.subject === 'quote_followup'
          ? 'Quote follow-up'
          : person.subject === 'invoice_reminder'
            ? 'Invoice reminder'
            : 'Booking message',
    customerName: person.name,
    customerId: person.customerId,
    bookingId: person.bookingId,
    detail: person.detail,
    body: person.body,
    status: 'ready' as const,
    visitDate: person.visitDate,
    subject: person.subject,
  }));
}

export function AssistantPage({
  today,
  usage: initialUsage,
  chatUsage,
  isPro = false,
}: {
  today: AssistantToday;
  usage: AssistantTextUsage;
  chatUsage: AssistantChatUsage;
  /** Pro unlocks prepare/send and Ask chat. Free sees real data + teaser. */
  isPro?: boolean;
}) {
  const [moment, setMoment] = useState<DayMoment>('morning');
  const [view, setView] = useState<AssistantView>('today');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [drafts, setDrafts] = useState<AssistantDraft[]>([]);
  const [preparedIds, setPreparedIds] = useState<string[] | null>(null);
  const [usage, setUsage] = useState(initialUsage);
  const [pendingAction, setPendingAction] = useState<'send' | null>(null);
  const [proTeaserOpen, setProTeaserOpen] = useState(false);

  const entries = useMemo(
    () => filterActivity(today.activity, filter),
    [today.activity, filter]
  );

  const updateDraft = (
    id: AssistantDraft['id'],
    patch: Partial<Pick<AssistantDraft, 'body' | 'status'>>
  ) => {
    setDrafts(current =>
      current.map(draft => (draft.id === id ? { ...draft, ...patch } : draft))
    );
  };

  const markDrafts = (
    ids: readonly string[],
    status: 'sent' | 'skipped'
  ) => {
    const idSet = new Set(ids);
    setDrafts(current =>
      current.map(draft =>
        draft.status === 'ready' && idSet.has(draft.id)
          ? { ...draft, status }
          : draft
      )
    );
  };

  const postDecision = async (
    path: string,
    ids: readonly string[]
  ): Promise<AssistantDecisionResponse | null> => {
    const idSet = new Set(ids);
    const items = drafts
      .filter(
        draft =>
          draft.status === 'ready' &&
          idSet.has(draft.id) &&
          (draft.subject === 'review_followup' ||
            draft.subject === 'rebook_checkin')
      )
      .map(draft => ({
        customerId: draft.customerId,
        bookingId: draft.bookingId ?? null,
        subject: draft.subject as 'review_followup' | 'rebook_checkin',
        body: draft.body,
      }));

    if (items.length === 0) return null;

    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    return (await response.json()) as AssistantDecisionResponse;
  };

  const sendSelected = async (ids: readonly string[]) => {
    if (pendingAction) return;
    setPendingAction('send');
    try {
      const result = await postDecision(ASSISTANT_API.SEND, ids);
      if (!result) return;
      if (!result.success) {
        if (result.usage) setUsage(result.usage);
        toast.error(result.error);
        return;
      }
      setUsage(result.usage);

      const successIds = successDraftIds(drafts, ids, result.results);
      if (successIds.length > 0) markDrafts(successIds, 'sent');

      const failed = (result.results ?? []).filter(item => !item.ok);
      if (failed.length > 0) {
        toast.error(summarizeSendFailures(failed));
      } else if (successIds.length > 0) {
        toast.success(
          successIds.length === 1
            ? 'Text sent'
            : `${successIds.length} texts sent`
        );
      }
    } catch {
      toast.error('Could not send. Try again.');
    } finally {
      setPendingAction(null);
    }
  };

  const preparedDrafts = preparedIds
    ? drafts.filter(draft => preparedIds.includes(draft.id))
    : drafts;

  const morningLayout = view === 'today' && moment === 'morning';

  return (
    <AssistantShell>
      <div
        className={`relative flex flex-1 flex-col ${
          morningLayout ? '' : 'px-4 sm:px-8 lg:px-12'
        }`}
      >
        {view === 'activity' ||
        (moment !== 'morning' && moment !== 'prepare') ? (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setView(current => (current === 'today' ? 'activity' : 'today'))
              }
              className="cursor-pointer text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {view === 'today' ? 'Activity' : 'Today'}
            </button>
          </div>
        ) : null}

        <div
          key={`${view}-${moment}`}
          className="assistant-fade flex flex-1 flex-col"
        >
          {view === 'activity' ? (
            <ActivityLog
              entries={entries}
              filter={filter}
              onFilterChange={setFilter}
            />
          ) : null}

          {view === 'today' && moment === 'morning' ? (
            <MorningMoment
              reviews={today.reviews}
              checkIns={today.checkIns}
              activity={today.activity}
              chatUsage={chatUsage}
              unlocked={isPro}
              onOpenActivity={() => setView('activity')}
              onRequestUpgrade={() => setProTeaserOpen(true)}
              onPrepare={people => {
                if (!isPro) {
                  setProTeaserOpen(true);
                  return;
                }
                setPreparedIds(people.map(person => person.id));
                setDrafts(draftsFromPeople(people));
                setMoment('prepare');
              }}
            />
          ) : null}

          {view === 'today' && moment === 'prepare' && isPro ? (
            <PrepareMoment
              drafts={preparedDrafts}
              usage={usage}
              pending={pendingAction !== null}
              pendingAction={pendingAction}
              onBack={() => {
                setPreparedIds(null);
                setMoment('morning');
              }}
              onBodyChange={(id, body) => updateDraft(id, { body })}
              onSendSelected={sendSelected}
            />
          ) : null}

          {view === 'today' && moment === 'sent' ? (
            <SentMoment
              drafts={drafts}
              onContinue={() => setMoment('midday')}
            />
          ) : null}

          {view === 'today' && moment === 'midday' ? (
            <MiddayMoment
              drafts={drafts}
              onEvening={() => setMoment('evening')}
            />
          ) : null}

          {view === 'today' && moment === 'evening' ? (
            <EveningMoment drafts={drafts} />
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={proTeaserOpen}
        onClose={() => setProTeaserOpen(false)}
        title="Assistant"
        maxWidth="sm"
      >
        <AssistantProTeaserModalBody
          onClose={() => setProTeaserOpen(false)}
        />
      </Modal>
    </AssistantShell>
  );
}
