'use client';

import { Button } from '@/components/shared';
import { useAuth } from '@/features/auth';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { ConfirmDeleteAccountModal } from './ConfirmDeleteAccountModal';

export interface DeleteAccountSectionProps {
  /** Auth user's email — used to validate the typed confirmation. */
  accountEmail: string;
}

/**
 * Settings entry point for permanent account deletion.
 * Opens `ConfirmDeleteAccountModal`; on success signs out and goes home.
 */
export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({
  accountEmail,
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleDeleted = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // ignore — server already deleted the user
    }
    try {
      window.localStorage.removeItem('auth-store');
    } catch {
      // ignore
    }
    router.replace('/');
  }, [router, signOut]);

  return (
    <>
      <ConfirmDeleteAccountModal
        isOpen={open}
        onClose={() => setOpen(false)}
        accountEmail={accountEmail}
        onDeleted={handleDeleted}
      />

      <section className="w-full min-w-0">
        <h2 className="mb-3 text-lg sm:text-xl font-semibold text-red-300">
          Delete account
        </h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm leading-snug text-zinc-500">
            Permanently remove your account, business profile, and all
            associated data. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setOpen(true)}
            className="mt-4 w-full sm:w-auto"
          >
            Delete account
          </Button>
        </div>
      </section>
    </>
  );
};
