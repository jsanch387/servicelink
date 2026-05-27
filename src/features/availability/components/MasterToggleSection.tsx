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
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 md:p-8 transition-colors hover:border-white/15">
      <Switch
        checked={acceptBookings}
        onCheckedChange={onToggle}
        size="sm"
        label="Accept Bookings"
        description="Temporarily stop receiving new booking requests."
      />
    </div>
  );
};
