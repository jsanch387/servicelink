'use client';

import { Switch } from '@/components/shared';
import React from 'react';

interface BookingConfirmationSectionProps {
  autoConfirm: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export const BookingConfirmationSection: React.FC<
  BookingConfirmationSectionProps
> = ({ autoConfirm, onToggle, disabled = false }) => {
  const description = autoConfirm
    ? 'Appointments are auto-confirmed when a customer finishes booking.'
    : 'Customers request an appointment. You must approve it before it’s confirmed.';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:px-6 sm:py-4 transition-colors hover:border-white/15">
      <Switch
        checked={autoConfirm}
        onCheckedChange={onToggle}
        disabled={disabled}
        size="sm"
        label="Auto-confirm bookings"
        description={description}
      />
    </div>
  );
};
