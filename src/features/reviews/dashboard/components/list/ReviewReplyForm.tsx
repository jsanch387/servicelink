'use client';

import { Button, TextArea } from '@/components/shared';
import React, { useCallback, useId, useState } from 'react';

const REPLY_MAX_LENGTH = 1000;

interface ReviewReplyFormProps {
  onSend: (body: string) => void | Promise<void>;
  onCancel: () => void;
}

export const ReviewReplyForm: React.FC<ReviewReplyFormProps> = ({
  onSend,
  onCancel,
}) => {
  const replyFieldId = useId();
  const [replyDraft, setReplyDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = replyDraft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await onSend(trimmed);
      setReplyDraft('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send reply';
      setSendError(message);
    } finally {
      setSending(false);
    }
  }, [replyDraft, sending, onSend]);

  return (
    <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
      <TextArea
        label="Your reply"
        value={replyDraft}
        onChange={setReplyDraft}
        placeholder="Thank your customer…"
        rows={3}
        maxLength={REPLY_MAX_LENGTH}
        hideCharCount={replyDraft.length < REPLY_MAX_LENGTH - 80}
        name={`reply-${replyFieldId}`}
        disabled={sending}
      />
      {sendError ? (
        <p className="text-sm text-red-300" role="alert">
          {sendError}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onCancel}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="inverse"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => void handleSend()}
          disabled={!replyDraft.trim()}
          loading={sending}
        >
          {sending ? 'Sending' : 'Send reply'}
        </Button>
      </div>
    </div>
  );
};
