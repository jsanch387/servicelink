'use client';

import { Button, Modal } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';

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
            Removing this team member will stop them from accessing your shop.
            They won&apos;t be able to log in anymore.
          </p>
          <p className="truncate text-sm text-zinc-300">{member.email}</p>
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
