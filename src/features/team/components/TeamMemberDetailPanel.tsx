'use client';

import { Button, Input } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { teamMemberHeading } from '../utils/teamInviteDisplayName';

interface TeamMemberDetailPanelProps {
  member: TeamMemberUi;
  onClose: () => void;
  onSaveName: (
    member: TeamMemberUi,
    name: string
  ) => Promise<{ ok: true; name: string } | { ok: false; error: string }>;
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
  onSaveName,
  onRemove,
  isSaving = false,
}: TeamMemberDetailPanelProps) {
  const heading = teamMemberHeading(member);
  const status = member.status === 'invited' ? 'Invited' : 'Active';
  const [name, setName] = useState(member.name?.trim() || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(member.name?.trim() || '');
    setError(null);
  }, [member.id, member.name]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const dirty = name.trim() !== (member.name?.trim() || '');

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await onSaveName(member, name);
    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 md:bg-black/40 md:backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] animate-in slide-in-from-right duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-lg md:border-l md:border-white/5 md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-member-detail-title"
      >
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="-ml-2 cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back to team"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2
            id="team-member-detail-title"
            className="flex-1 truncate text-lg font-bold text-white"
          >
            Team member
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 scrollbar-dark sm:p-5 [-webkit-overflow-scrolling:touch]">
          <section className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-zinc-200"
            >
              {headingInitial(heading)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {heading}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {member.email}
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
              Status
            </h3>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-medium text-white">{status}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {member.status === 'invited'
                  ? 'They have not joined this shop yet.'
                  : 'They can open Bookings and run jobs.'}
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
              Name
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <Input
                id="team-member-edit-name"
                type="text"
                placeholder="Full name"
                aria-label="Name"
                value={name}
                onChange={value => {
                  setName(value);
                  if (error) setError(null);
                }}
                autoComplete="name"
                required
                maxLength={TEAM_INVITE_NAME_MAX_LENGTH}
                error={error ?? undefined}
              />
              <Button
                type="submit"
                variant="inverse"
                fullWidth
                loading={isSaving}
                disabled={isSaving || !dirty}
              >
                Save name
              </Button>
            </form>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
              Remove
            </h3>
            <Button
              type="button"
              variant="danger"
              fullWidth
              onClick={() => onRemove(member)}
            >
              Remove from team
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
