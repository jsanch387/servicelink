'use client';

import { Button, GlassCard } from '@/components/shared';
import { useAuth } from '@/features/auth';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { ConfirmDeleteAccountModal } from './ConfirmDeleteAccountModal';

export interface DeleteAccountSectionProps {
  /** Auth user's email — used to validate the typed confirmation. */
  accountEmail: string;
  /** When true, renders without the section heading (parent provides group label). */
  embedded?: boolean;
}

/**
 * Settings entry point for permanent account deletion.
 * Opens `ConfirmDeleteAccountModal`; on success signs out and goes home.
 */
export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({
  accountEmail,
  embedded = false,
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

      <section className="w-full min-w-0 space-y-4">
        {!embedded ? (
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Delete account
          </h2>
        ) : null}
        <GlassCard
          padding="none"
          rounded="rounded-2xl"
          blurColor="bg-zinc-500"
          showBlur
          className="w-full min-w-0 p-4 text-left"
        >
          <p className="text-sm leading-relaxed text-gray-400">
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
        </GlassCard>
      </section>
    </>
  );
};
