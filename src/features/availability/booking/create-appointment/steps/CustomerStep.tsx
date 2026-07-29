'use client';

import { GlassCard, Input, PhoneInput } from '@/components/shared';
import { isValidEmail } from '@/features/auth/utils/validation';
import {
  BOOKING_CUSTOMER_EMAIL_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import React from 'react';
import type { CreateAppointmentCustomer } from '../types';

export interface CustomerStepProps {
  customer: CreateAppointmentCustomer;
  onChange: (patch: Partial<CreateAppointmentCustomer>) => void;
}

export function CustomerStep({ customer, onChange }: CustomerStepProps) {
  const emailTrim = customer.email.trim();
  const emailError =
    emailTrim.length > 0 && !isValidEmail(emailTrim)
      ? 'Enter a valid email address'
      : undefined;

  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <div className="space-y-5">
        <Input
          label="Name"
          placeholder="e.g. Jordan Lee"
          value={customer.fullName}
          onChange={value =>
            onChange({
              fullName: value.slice(0, BOOKING_CUSTOMER_FULL_NAME_MAX),
            })
          }
          required
          autoComplete="name"
        />
        <PhoneInput
          label="Phone"
          value={customer.phone}
          onChange={value => onChange({ phone: value })}
          required
          showDigitHint={false}
        />
        <Input
          label="Email"
          placeholder="Optional"
          value={customer.email}
          onChange={value =>
            onChange({
              email: value.slice(0, BOOKING_CUSTOMER_EMAIL_MAX),
            })
          }
          type="email"
          inputMode="email"
          autoComplete="email"
          required={false}
          error={emailError}
        />
      </div>
    </GlassCard>
  );
}
