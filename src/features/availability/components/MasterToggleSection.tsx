'use client';

import { Switch } from '@/components/shared';
import React from 'react';

interface MasterToggleSectionProps {
  acceptBookings: boolean;

  onToggle: (value: boolean) => void;
}

export const MasterToggleSection: React.FC<MasterToggleSectionProps> = ({
  acceptBookings,
  onToggle,
}) => {
  const description = acceptBookings
    ? 'Turn off to stop accepting appointments on your public booking link.'
    : 'Turn on to accept appointments on your public booking link.';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:px-6 sm:py-4 transition-colors hover:border-white/15">
      <Switch
        checked={acceptBookings}
        onCheckedChange={onToggle}
        size="sm"
        label="Accept Bookings"
        description={description}
      />
    </div>
  );
};
