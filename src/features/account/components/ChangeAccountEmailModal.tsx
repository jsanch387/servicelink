'use client';

import { Button, Input, Modal } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { isValidEmail } from '@/features/auth';
import React, { useEffect, useState } from 'react';

export interface ChangeAccountEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  signedInWithGoogle?: boolean;
  /** Called after the API accepts the change request (confirmation email sent). */
  onRequested: (pendingEmail: string) => void;
}

/**
 * Modal to request an account email change via `PATCH /api/account`.
 * Supabase sends confirmation link(s); the address updates after the user confirms.
 */
export const ChangeAccountEmailModal: React.FC<
  ChangeAccountEmailModalProps
> = ({
  isOpen,
  onClose,
  currentEmail,
  signedInWithGoogle = false,
  onRequested,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const normalizedNew = newEmail.trim().toLowerCase();
  const normalizedCurrent = (currentEmail ?? '').trim().toLowerCase();
  const canSubmit =
    normalizedNew.length > 0 &&
    isValidEmail(normalizedNew) &&
    normalizedNew !== normalizedCurrent &&
    !submitting;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_ROUTES.ACCOUNT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: normalizedNew,
          // So confirmation links return to this origin (localhost when testing).
          redirectOrigin: window.location.origin,
        }),
      });
      const data = await res
        .json()
        .catch(() => ({}) as Record<string, unknown>);
      if (!res.ok || !data?.success) {
        const message =
          (typeof data?.error === 'string' && data.error) ||
          'Could not update your email. Please try again.';
        setError(message);
        setSubmitting(false);
        return;
      }
      const pending =
        typeof data.pendingEmail === 'string'
          ? data.pendingEmail
          : normalizedNew;
      onRequested(pending);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="md">
      <div className="space-y-5 -mt-2 min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Update email
          </h2>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            We&apos;ll send a confirmation link to the new address. Click it to
            finish the update
            {signedInWithGoogle
              ? '. You can still sign in with Google afterward.'
              : '.'}
          </p>
          <div
            className="mt-3 w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
            title={currentEmail}
          >
            <p className="text-left text-xs text-gray-500 mb-1">Current</p>
            <p className="text-left font-mono text-sm text-white leading-relaxed break-all select-all">
              {currentEmail || '—'}
            </p>
          </div>
        </div>

        <Input
          id="change-account-email"
          label="New email"
          value={newEmail}
          onChange={setNewEmail}
          type="email"
          placeholder="you@business.com"
          autoComplete="email"
          disabled={submitting}
          error={error ?? undefined}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            className="w-full sm:w-auto"
          >
            Send confirmation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
