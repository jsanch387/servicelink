'use client';

import {
  CheckIcon,
  ChevronLeftIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { TextArea } from '@/components/shared';
import React, { useEffect, useMemo, useState } from 'react';

import type { AssistantTextUsage } from '../server/assistantUsageMonth';
import type { AssistantDraft } from '../types';
import { TextUsageRing } from './TextUsageRing';

const BATCH_LIMIT = 20;

function prepareCopy(drafts: readonly AssistantDraft[]) {
  const subject = drafts[0]?.subject;

  if (subject === 'rebook_checkin') {
    return {
      title: 'Check in with customers',
      subtitle: 'These customers haven’t booked in a while.',
      visitLabel: 'Visit',
    };
  }

  return {
    title: 'Ask for reviews',
    subtitle: 'These customers haven’t left one yet.',
    visitLabel: 'Visit',
  };
}

function SquareCheck({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  const filled = checked || indeterminate;
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] ${
        filled
          ? 'bg-white text-[#111111]'
          : 'border-[1.5px] border-[#3A3A3A] bg-transparent'
      }`}
    >
      {indeterminate ? (
        <MinusIcon className="h-3 w-3" strokeWidth={3.2} />
      ) : checked ? (
        <CheckIcon className="h-3 w-3" strokeWidth={3.2} />
      ) : null}
    </span>
  );
}

function MessageBody({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className="text-[15px] leading-[1.55] font-normal whitespace-pre-wrap text-[#D4D4D4]">
      {parts.map((part, index) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <span key={`${part}-${index}`} className="text-[#8F8F8F]">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </p>
  );
}

export function PrepareMoment({
  drafts,
  usage,
  pending = false,
  pendingAction = null,
  onBack,
  onBodyChange,
  onSendSelected,
}: {
  drafts: readonly AssistantDraft[];
  usage: AssistantTextUsage;
  pending?: boolean;
  pendingAction?: 'send' | null;
  onBack: () => void;
  onBodyChange: (id: AssistantDraft['id'], body: string) => void;
  onSendSelected: (ids: readonly string[]) => void;
}) {
  const visibleDrafts = useMemo(
    () =>
      drafts
        .filter(draft => draft.status !== 'skipped')
        .slice(0, BATCH_LIMIT),
    [drafts]
  );
  const readyIds = useMemo(
    () =>
      visibleDrafts
        .filter(draft => draft.status === 'ready')
        .map(draft => draft.id),
    [visibleDrafts]
  );
  const [selected, setSelected] = useState<string[]>(() => [...readyIds]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSelected(current => {
      const next = readyIds.filter(id => current.includes(id));
      return next.length > 0 ? next : [...readyIds];
    });
  }, [readyIds]);

  const selectedDrafts = visibleDrafts.filter(draft =>
    selected.includes(draft.id)
  );
  const previewDraft = selectedDrafts[0] ?? visibleDrafts[0];
  const copy = prepareCopy(visibleDrafts);
  const sendCount = selectedDrafts.filter(
    draft => draft.status === 'ready'
  ).length;
  const allSelected =
    readyIds.length > 0 && readyIds.every(id => selected.includes(id));
  const someSelected = selected.length > 0 && !allSelected;
  const overQuota = sendCount > usage.remaining;
  const sendBlocked = sendCount === 0 || overQuota || Boolean(pending);

  const toggle = (id: string) => {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelected(allSelected || someSelected ? [] : [...readyIds]);
  };

  const onSharedBodyChange = (body: string) => {
    for (const draft of visibleDrafts) {
      if (draft.status === 'ready') onBodyChange(draft.id, body);
    }
  };

  const selectedReadyIds = selectedDrafts
    .filter(draft => draft.status === 'ready')
    .map(draft => draft.id);

  return (
    <div className="flex w-full flex-col">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit cursor-pointer items-center gap-0.5 text-[14px] font-medium text-[#9A9A9A] transition-colors hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        Assistant
      </button>

      <header className="mt-[18px] lg:grid lg:grid-cols-[minmax(0,1fr)_600px] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 lg:block">
            <h2 className="min-w-0 text-[22px] font-bold tracking-[-0.5px] text-white sm:text-[28px] sm:tracking-[-0.6px]">
              {copy.title}
            </h2>
            <div className="shrink-0 lg:hidden">
              <TextUsageRing usage={usage} />
            </div>
          </div>
          <p className="mt-1 text-[15px] font-normal text-[#9A9A9A]">
            {copy.subtitle}
          </p>
        </div>
        <div className="hidden justify-end lg:flex">
          <TextUsageRing usage={usage} />
        </div>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_600px] lg:items-start">
        <section className="min-w-0 overflow-hidden rounded-[14px] border border-[#242424] bg-[#181818]">
          <div className="sticky top-0 z-10 grid min-h-11 grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-4 bg-[#181818] px-6">
            <button
              type="button"
              onClick={toggleAll}
              aria-label={
                allSelected || someSelected ? 'Clear selection' : 'Select all'
              }
              className="cursor-pointer"
            >
              <SquareCheck checked={allSelected} indeterminate={someSelected} />
            </button>
            <span className="text-[13px] font-medium text-[#8F8F8F]">
              Customer
            </span>
            <span className="text-right text-[13px] font-medium text-[#8F8F8F]">
              {copy.visitLabel}
            </span>
          </div>

          <ul>
            {visibleDrafts.map(draft => {
              const isSelected = selected.includes(draft.id);
              const sent = draft.status === 'sent';
              return (
                <li key={draft.id}>
                  <button
                    type="button"
                    onClick={() => toggle(draft.id)}
                    aria-pressed={isSelected}
                    disabled={sent}
                    className="grid min-h-[58px] w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-4 border-t border-[#242424] px-6 text-left transition-colors hover:bg-[#1C1C1C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SquareCheck checked={isSelected || sent} />
                    <span className="truncate text-[15px] font-semibold text-[#F5F5F5]">
                      {draft.customerName}
                    </span>
                    <span className="text-right text-[14px] font-normal text-[#9A9A9A] tabular-nums">
                      {sent ? 'Sent' : (draft.visitDate ?? draft.detail)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
          <div className="flex flex-col gap-[14px] rounded-[14px] border border-[#242424] bg-[#181818] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white">Message</h3>
              <button
                type="button"
                onClick={() => setEditing(current => !current)}
                className="cursor-pointer text-[13px] font-semibold text-[#F5F5F5] underline underline-offset-[3px] transition-colors hover:text-white"
              >
                {editing ? 'Done' : 'Edit'}
              </button>
            </div>
            {editing && previewDraft ? (
              <TextArea
                aria-label="Message text"
                value={previewDraft.body}
                onChange={onSharedBodyChange}
                rows={8}
              />
            ) : previewDraft ? (
              <MessageBody text={previewDraft.body} />
            ) : (
              <p className="text-[15px] leading-[1.55] text-[#D4D4D4]">
                Nothing selected yet.
              </p>
            )}
          </div>

          {overQuota ? (
            <p className="text-[13px] font-medium text-[#E57373]" role="alert">
              Select fewer texts — only {usage.remaining} left this month.
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={sendBlocked}
              onClick={() => onSendSelected(selectedReadyIds)}
              aria-busy={pendingAction === 'send'}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-5 text-[15px] font-semibold text-[#111111] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pendingAction === 'send' ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-[#111111]/25 border-t-[#111111]"
                    aria-hidden
                  />
                  Sending
                </>
              ) : sendCount === 0 ? (
                'Send texts'
              ) : sendCount === 1 ? (
                'Send 1 text'
              ) : (
                `Send ${sendCount} texts`
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
