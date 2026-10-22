'use client';

import React, { useMemo, useState } from 'react';

import './assistant.css';

import { filterActivity } from '../mock/sampleDay';
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
  PrepareMoment,
  SentMoment,
} from './AssistantMoments';
import { AssistantShell } from './AssistantShell';

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
    customerName: person.firstName,
    detail: person.detail,
    body: person.body,
    status: 'ready' as const,
  }));
}

export function AssistantPage({ today }: { today: AssistantToday }) {
  const [moment, setMoment] = useState<DayMoment>('morning');
  const [view, setView] = useState<AssistantView>('today');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [drafts, setDrafts] = useState<AssistantDraft[]>([]);
  const [preparedIds, setPreparedIds] = useState<string[] | null>(null);

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

  const sendBoth = () => {
    setDrafts(current =>
      current.map(draft =>
        draft.status === 'ready' &&
        (preparedIds === null || preparedIds.includes(draft.id))
          ? { ...draft, status: 'sent' }
          : draft
      )
    );
  };

  const preparedDrafts = preparedIds
    ? drafts.filter(draft => preparedIds.includes(draft.id))
    : drafts;

  return (
    <AssistantShell>
      <h1 className="sr-only">Assistant</h1>
      <div className="relative flex flex-1 flex-col">
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
              quotes={today.quotes}
              invoices={today.invoices}
              reviews={today.reviews}
              checkIns={today.checkIns}
              activity={today.activity}
              onOpenActivity={() => setView('activity')}
              onPrepare={people => {
                setPreparedIds(people.map(person => person.id));
                setDrafts(draftsFromPeople(people));
                setMoment('prepare');
              }}
            />
          ) : null}

          {view === 'today' && moment === 'prepare' ? (
            <PrepareMoment
              drafts={preparedDrafts}
              onBack={() => {
                setPreparedIds(null);
                setMoment('morning');
              }}
              onBodyChange={(id, body) => updateDraft(id, { body })}
              onSend={id => updateDraft(id, { status: 'sent' })}
              onSkip={id => updateDraft(id, { status: 'skipped' })}
              onUndo={id => updateDraft(id, { status: 'ready' })}
              onSendBoth={sendBoth}
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
    </AssistantShell>
  );
}
