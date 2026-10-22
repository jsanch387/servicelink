import { Button, StatusPill, TextArea } from '@/components/shared';
import React from 'react';

import type { AssistantDraft } from '../types';

export function DraftMessageCard({
  draft,
  onBodyChange,
  onSend,
  onSkip,
  onUndo,
}: {
  draft: AssistantDraft;
  onBodyChange: (body: string) => void;
  onSend: () => void;
  onSkip: () => void;
  onUndo: () => void;
}) {
  const resolved = draft.status !== 'ready';

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium tracking-tight text-white">
            {draft.customerName}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {draft.label}
            <span className="mx-1.5 text-white/30">·</span>
            {draft.detail}
          </p>
        </div>
        {draft.status === 'sent' ? (
          <StatusPill tone="success">Sent</StatusPill>
        ) : null}
        {draft.status === 'skipped' ? (
          <StatusPill tone="neutral">Skipped</StatusPill>
        ) : null}
      </div>

      {resolved ? (
        <p className="mt-4 flex-1 text-sm leading-6 whitespace-pre-wrap text-white/80">
          {draft.body}
        </p>
      ) : (
        <TextArea
          className="mt-4 flex-1"
          aria-label={`${draft.label} for ${draft.customerName}`}
          value={draft.body}
          onChange={onBodyChange}
          rows={3}
        />
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        {resolved ? (
          <Button variant="ghost" size="xs" onClick={onUndo}>
            Undo
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="xs" onClick={onSkip}>
              Skip
            </Button>
            <Button
              variant="primary"
              size="xs"
              aria-label={`Send to ${draft.customerName}`}
              onClick={onSend}
            >
              Send
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
