'use client';

import { GlassCard, formatUsPhoneDigits } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React from 'react';
import type { PublicQuoteRequestFormData } from '../types';

interface PublicQuoteRequestSuccessProps {
  businessName: string;
  businessSlug: string;
  form: PublicQuoteRequestFormData;
  showVehicleFields: boolean;
  /** Returned from API after insert — use to verify the row in Supabase. */
  quoteId: string | null;
}

/**
 * Confirmation UI after a public quote request is saved (aligned with
 * {@link BookingSuccess} spacing and check treatment).
 */
export const PublicQuoteRequestSuccess: React.FC<
  PublicQuoteRequestSuccessProps
> = ({ businessName, businessSlug, form, showVehicleFields, quoteId }) => {
  return (
    <div className="flex w-full flex-col py-10 pb-16">
      <div className="mb-8 flex h-20 w-20 self-center items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25">
        <CheckIcon className="h-10 w-10 text-white" />
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold text-white">
        Quote request sent
      </h2>
      <p className="mx-auto mb-8 max-w-sm text-center text-sm text-gray-400">
        Thanks for reaching out to {businessName}. They should review your
        request soon and follow up by email or phone.
      </p>
      {quoteId ? (
        <p className="mx-auto mb-6 max-w-sm text-center text-xs text-zinc-500">
          Reference: <span className="font-mono text-zinc-400">{quoteId}</span>
        </p>
      ) : null}

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-emerald-500"
        showBlur={true}
        className="mb-8 w-full"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-gray-300">Request summary</p>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div>
            <p className="mb-0.5 text-xs text-gray-500">Customer</p>
            <p className="font-medium text-white">{form.customerName}</p>
            <p className="break-words text-sm text-gray-400">
              {form.customerEmail}
            </p>
            <p className="mt-0.5 text-sm text-gray-400 tabular-nums">
              {formatUsPhoneDigits(form.customerPhone)}
            </p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="mb-0.5 text-xs text-gray-500">Service</p>
            <p className="font-medium text-white">{form.serviceRequested}</p>
          </div>
          {showVehicleFields ? (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="mb-0.5 text-xs text-gray-500">Vehicle</p>
                <p className="font-medium text-white">
                  {[
                    form.vehicleYear.trim(),
                    form.vehicleMake.trim(),
                    form.vehicleModel.trim(),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
            </>
          ) : null}
          {form.timeline.trim() ? (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="mb-0.5 text-xs text-gray-500">When?</p>
                <p className="font-medium text-white">{form.timeline}</p>
              </div>
            </>
          ) : null}
          <div className="h-px bg-white/10" />
          <div>
            <p className="mb-0.5 text-xs text-gray-500">
              What needs to be done
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-400">
              {form.details}
            </p>
          </div>
        </div>
      </GlassCard>

      <Link
        href={`/${businessSlug}`}
        className="inline-flex min-h-[48px] items-center justify-center self-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
      >
        Back to profile
      </Link>
    </div>
  );
};
