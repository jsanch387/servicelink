'use client';

import { Button, Input, Modal } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';
import { type AssignableTeamRole } from '../constants/teamRoles';
import { TeamRoleSelect } from './TeamRoleSelect';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    name: string,
    role: AssignableTeamRole
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
  const [role, setRole] = useState<AssignableTeamRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setRole('member');
      setError(null);
      setSending(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await onInvite(email.trim(), name.trim(), role);
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
  const roleError =
    error && error.toLowerCase().includes('role') ? error : undefined;
  const emailError = error && !nameError && !roleError ? error : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={sending}
      title="Send invite"
      maxWidth="sm"
      uniformHorizontalPadding16
      panelMaxHeightClass="h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] sm:h-auto sm:max-h-[90vh]"
      contentClassName="flex flex-col max-sm:min-h-0 max-sm:flex-1"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-5 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:flex-none sm:pb-0"
      >
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
          disabled={sending}
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
          disabled={sending}
          error={emailError}
        />
        <TeamRoleSelect
          value={role}
          disabled={sending}
          error={roleError}
          onChange={next => {
            setRole(next);
            if (error) setError(null);
          }}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          loading={sending}
          disabled={sending}
          className="mt-auto sm:mt-1"
        >
          Send invite
        </Button>
      </form>
    </Modal>
  );
};
