'use client';

import { useAuth } from '@/features/auth';
import { TrashIcon } from '@heroicons/react/24/outline';
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-1 py-2 text-sm font-medium text-red-300/80 transition-colors hover:text-red-200"
      >
        <TrashIcon className="h-5 w-5 shrink-0 text-red-400/70 transition-colors group-hover:text-red-300" />
        Delete account
      </button>
    </>
  );
};
