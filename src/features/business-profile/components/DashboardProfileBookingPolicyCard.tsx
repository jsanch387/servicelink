'use client';

import { GlassCard, Switch, TextArea } from '@/components/shared';
import {
  BOOKING_POLICY_MAX_LENGTH,
  type BookingPolicyUiState,
} from '../utils/bookingPolicy';

export interface DashboardProfileBookingPolicyCardProps {
  value: BookingPolicyUiState;
  onChange: (next: BookingPolicyUiState) => void;
  error?: string;
}

export function DashboardProfileBookingPolicyCard({
  value,
  onChange,
  error,
}: DashboardProfileBookingPolicyCardProps) {
  return (
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Customer policy</p>
      <p className="mt-1 text-xs text-zinc-500">
        Customers must agree before they can book.
      </p>

      <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-200">Require agreement</p>
          <Switch
            checked={value.enabled}
            onCheckedChange={enabled => onChange({ ...value, enabled })}
            size="md"
            aria-label="Require customers to agree to a policy"
          />
        </div>

        {value.enabled ? (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <TextArea
              label="Policy"
              value={value.text}
              onChange={text => onChange({ ...value, text })}
              placeholder="Cancellation, late arrival, and shop rules…"
              rows={6}
              maxLength={BOOKING_POLICY_MAX_LENGTH}
              error={error}
            />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
