'use client';

import { Button, IconButton, Input } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';
import {
  storedTeamRole,
  type AssignableTeamRole,
} from '../constants/teamRoles';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { teamMemberHeading } from '../utils/teamInviteDisplayName';
import { TeamRoleSelect } from './TeamRoleSelect';

interface TeamMemberDetailChanges {
  name?: string;
  role?: AssignableTeamRole;
}

interface TeamMemberDetailPanelProps {
  member: TeamMemberUi;
  onClose: () => void;
  onSave: (
    member: TeamMemberUi,
    changes: TeamMemberDetailChanges
  ) => Promise<
    | { ok: true; name?: string; role?: AssignableTeamRole }
    | { ok: false; error: string }
  >;
  onRemove: (member: TeamMemberUi) => void;
  isSaving?: boolean;
}

function headingInitial(label: string): string {
  const letter = label.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

export function TeamMemberDetailPanel({
  member,
  onClose,
  onSave,
  onRemove,
  isSaving = false,
}: TeamMemberDetailPanelProps) {
  const heading = teamMemberHeading(member);
  const savedName = member.name?.trim() || '';
  const savedRole = storedTeamRole(member.role);
  const status = member.status === 'invited' ? 'Invited' : 'Active';
  const [name, setName] = useState(savedName);
  const [role, setRole] = useState<AssignableTeamRole>(savedRole);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(member.name?.trim() || '');
    setRole(storedTeamRole(member.role));
    setError(null);
  }, [member.id, member.name, member.role]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const nameDirty = name.trim() !== savedName;
  const roleDirty = role !== savedRole;
  const dirty = nameDirty || roleDirty;
  const roleError =
    error && error.toLowerCase().includes('role') ? error : undefined;
  const nameError = error && !roleError ? error : undefined;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const changes: TeamMemberDetailChanges = {};
    if (nameDirty) changes.name = name;
    if (roleDirty) changes.role = role;
    const result = await onSave(member, changes);
    if (!result.ok) setError(result.error);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 md:bg-black/40 md:backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-lg md:border-l md:border-white/[0.08] md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-member-detail-title"
      >
        <header className="flex shrink-0 items-center gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3">
          <IconButton
            icon={<ArrowLeftIcon className="h-5 w-5" />}
            onClick={onClose}
            aria-label="Back to team"
            variant="ghost"
            size="md"
          />
          <h2
            id="team-member-detail-title"
            className="truncate text-base font-semibold tracking-tight text-white"
          >
            Team member
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4 scrollbar-dark [-webkit-overflow-scrolling:touch]">
          <section className="mb-8 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-white"
            >
              {headingInitial(heading)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight text-white">
                {heading}
              </p>
              <p className="truncate text-sm text-white/60">{member.email}</p>
            </div>
            <p
              className={`shrink-0 text-sm font-medium ${
                member.status === 'invited'
                  ? 'text-white/60'
                  : 'text-emerald-400'
              }`}
            >
              {status}
            </p>
          </section>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <TeamRoleSelect
              value={role}
              disabled={isSaving}
              error={roleError}
              onChange={next => {
                setRole(next);
                if (error) setError(null);
              }}
            />
            <Input
              id="team-member-edit-name"
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
              disabled={isSaving}
              error={nameError}
            />
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isSaving}
                disabled={isSaving || !dirty}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={() => onRemove(member)}
              >
                Remove from team
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
