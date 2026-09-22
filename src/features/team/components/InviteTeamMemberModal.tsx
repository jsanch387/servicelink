'use client';

import { Button, Input, Modal } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    name: string
  ) =>
    | { ok: true }
    | { ok: false; error: string }
    | Promise<{ ok: true } | { ok: false; error: string }>;
}

export const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setError(null);
      setSending(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await onInvite(email.trim(), name.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    } finally {
      setSending(false);
    }
  };

  const nameError =
    error && error.toLowerCase().includes('name') ? error : undefined;
  const emailError = error && !nameError ? error : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite"
      maxWidth="sm"
      uniformHorizontalPadding16
      panelClassName="min-h-[50dvh] sm:min-h-0"
      contentClassName="flex flex-col"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-0"
      >
        <p className="text-sm leading-relaxed text-zinc-400">
          Send an invite so they can join your team.
        </p>
        <Input
          id="team-invite-name"
          type="text"
          label="Name"
          placeholder="Full name"
          value={name}
          onChange={value => {
            setName(value);
            if (error) setError(null);
          }}
          autoComplete="name"
          required
          maxLength={TEAM_INVITE_NAME_MAX_LENGTH}
          error={nameError}
        />
        <Input
          id="team-invite-email"
          type="email"
          label="Email"
          placeholder="name@email.com"
          value={email}
          onChange={value => {
            setEmail(value);
            if (error) setError(null);
          }}
          autoComplete="email"
          inputMode="email"
          required
          error={emailError}
        />
        <div className="mt-auto pt-2 sm:mt-0 sm:pt-0">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={sending}
            disabled={sending}
          >
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
};
