'use client';

import { Button, Input, Modal } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useEffect, useState } from 'react';

export interface ConfirmDeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Auth user's email — typed value must match this (case-insensitive). */
  accountEmail: string;
  /** Called after the API returns success, before any sign-out / redirect. */
  onDeleted: () => void | Promise<void>;
}

/**
 * Modal that asks the user to type their email to confirm permanent deletion.
 * Calls `DELETE /api/account` with `{ confirmEmail }` using the existing
 * Supabase auth cookies (web). On success, calls `onDeleted` so the parent
 * can sign out and navigate away.
 */
export const ConfirmDeleteAccountModal: React.FC<
  ConfirmDeleteAccountModalProps
> = ({ isOpen, onClose, accountEmail, onDeleted }) => {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmEmail('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const normalizedTyped = confirmEmail.trim().toLowerCase();
  const normalizedAccount = (accountEmail ?? '').trim().toLowerCase();
  const matches =
    normalizedTyped.length > 0 && normalizedTyped === normalizedAccount;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!matches || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_ROUTES.ACCOUNT, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: normalizedTyped }),
      });
      const data = await res
        .json()
        .catch(() => ({}) as Record<string, unknown>);
      if (!res.ok || !data?.success) {
        const message =
          (typeof data?.error === 'string' && data.error) ||
          'Could not delete your account. Please try again.';
        setError(message);
        setSubmitting(false);
        return;
      }
      await onDeleted();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="md">
      <div className="space-y-6 -mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Delete your account
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
            This permanently removes your ServiceLink account, profile, and
            data. Any active subscription will be canceled immediately. This
            cannot be undone.
          </p>
        </div>

        <div className="rounded-xl border border-red-400/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          To confirm, type your email{' '}
          <span className="font-mono text-red-100 break-all">
            {accountEmail}
          </span>{' '}
          below.
        </div>

        <Input
          label="Confirm email"
          value={confirmEmail}
          onChange={setConfirmEmail}
          type="email"
          placeholder={accountEmail}
          autoComplete="off"
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
            variant="danger"
            onClick={handleConfirm}
            disabled={!matches || submitting}
            loading={submitting}
            className="w-full sm:w-auto"
          >
            Delete account
          </Button>
        </div>
      </div>
    </Modal>
  );
};
