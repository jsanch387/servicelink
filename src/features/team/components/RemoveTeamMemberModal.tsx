'use client';

import { Button, Modal } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { teamMemberHeading } from '../utils/teamInviteDisplayName';

interface RemoveTeamMemberModalProps {
  member: TeamMemberUi | null;
  onClose: () => void;
  onConfirm: (member: TeamMemberUi) => void | Promise<void>;
}

export const RemoveTeamMemberModal: React.FC<RemoveTeamMemberModalProps> = ({
  member,
  onClose,
  onConfirm,
}) => {
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!member) setRemoving(false);
  }, [member]);

  const handleConfirm = async () => {
    if (!member || removing) return;
    setRemoving(true);
    try {
      await onConfirm(member);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Modal
      isOpen={member != null}
      onClose={onClose}
      title="Remove"
      maxWidth="sm"
      uniformHorizontalPadding16
      preventClose={removing}
    >
      {member ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-zinc-400">
            Are you sure you want to remove this team member? They won&apos;t be
            able to access this shop.
          </p>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-zinc-200">
              {teamMemberHeading(member)}
            </p>
            {member.name?.trim() ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {member.email}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              disabled={removing}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={removing}
              disabled={removing}
              onClick={() => void handleConfirm()}
              aria-label={removing ? 'Removing team member' : 'Remove'}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
