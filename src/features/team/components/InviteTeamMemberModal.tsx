'use client';

import { Button, Input, Modal } from '@/components/shared';
import { fieldBoxClassName, fieldLabelClassName } from '@/components/shared/fieldStyles';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';
import {
  ASSIGNABLE_TEAM_ROLES,
  teamRoleCopy,
  type AssignableTeamRole,
} from '../constants/teamRoles';

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
  const [roleOpen, setRoleOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuId = useId();
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setRole('member');
      setRoleOpen(false);
      setError(null);
      setSending(false);
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!roleOpen) return;
    const place = () => {
      const button = roleButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 200,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [roleOpen]);

  useEffect(() => {
    if (!roleOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        roleButtonRef.current?.contains(target) ||
        roleMenuRef.current?.contains(target)
      ) {
        return;
      }
      setRoleOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [roleOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    setRoleOpen(false);
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
  const selectedRole = teamRoleCopy(role);

  const roleMenu =
    roleOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={roleMenuRef}
            id={roleMenuId}
            role="listbox"
            aria-label="Role"
            style={menuStyle}
            className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#1c1c1c] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"
          >
            {ASSIGNABLE_TEAM_ROLES.map(option => {
              const copy = teamRoleCopy(option);
              const selected = option === role;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-left ${
                    selected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                  onClick={() => {
                    setRole(option);
                    setRoleOpen(false);
                    if (error) setError(null);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">
                      {copy.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-white/60">
                      {copy.description}
                    </span>
                  </span>
                  {selected ? (
                    <CheckIcon
                      className="h-4 w-4 shrink-0 text-white"
                      aria-hidden
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={sending}
      title="Send invite"
      maxWidth="sm"
      uniformHorizontalPadding16
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-0"
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
        <div>
          <p id="team-invite-role-label" className={fieldLabelClassName}>
            Role
          </p>
          <button
            ref={roleButtonRef}
            type="button"
            disabled={sending}
            aria-haspopup="listbox"
            aria-expanded={roleOpen}
            aria-controls={roleMenuId}
            aria-labelledby="team-invite-role-label"
            onClick={() => setRoleOpen(open => !open)}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 text-left text-base text-white sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${fieldBoxClassName} ${
              roleError
                ? 'border-red-500/50 bg-red-500/5'
                : 'hover:border-white/25'
            }`}
          >
            <span className="min-w-0 truncate">{selectedRole.label}</span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${
                roleOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </button>
          {roleError ? (
            <p className="mt-1.5 text-sm text-red-400" role="alert">
              {roleError}
            </p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">
              {selectedRole.description}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          loading={sending}
          disabled={sending}
          className="mt-1"
        >
          Send invite
        </Button>
      </form>
      {roleMenu}
    </Modal>
  );
};
