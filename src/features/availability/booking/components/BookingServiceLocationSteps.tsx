'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';
import type { CustomerServiceChoice } from '../utils/bookingServiceLocationFlow';

export function BookingShopVisitAddress({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  const trimmed = address.trim();
  if (!trimmed) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-200">{trimmed}</p>
    </div>
  );
}

export function BookingServiceLocationChoice({
  value,
  onChange,
  bookingFlowLocale = 'en',
  isOwnerManualBooking = false,
  coverageLabel = null,
  shopAddressLabel = null,
}: {
  value: CustomerServiceChoice;
  onChange: (choice: 'mobile' | 'shop') => void;
  bookingFlowLocale?: PublicBookingFlowLocale;
  isOwnerManualBooking?: boolean;
  coverageLabel?: string | null;
  shopAddressLabel?: string | null;
}) {
  const sl = publicBookingUi(bookingFlowLocale).serviceLocation;

  const shopAddress = shopAddressLabel?.trim() || null;
  const options: {
    id: 'mobile' | 'shop';
    title: string;
    description: string;
    address?: string | null;
  }[] = [
    {
      id: 'mobile',
      title: isOwnerManualBooking ? sl.ownerMobileOption : sl.mobileOption,
      description: [
        isOwnerManualBooking ? sl.ownerMobileOptionDesc : sl.mobileOptionDesc,
        coverageLabel?.trim() ? coverageLabel.trim() : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    {
      id: 'shop',
      title: isOwnerManualBooking ? sl.ownerShopOption : sl.shopOption,
      description: isOwnerManualBooking
        ? sl.ownerShopOptionDesc
        : sl.shopOptionDesc,
      address: shopAddress,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
          {isOwnerManualBooking ? sl.ownerChooseHeading : sl.chooseHeading}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {isOwnerManualBooking ? sl.ownerChooseSubtitle : sl.chooseSubtitle}
        </p>
      </div>

      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={
          isOwnerManualBooking ? sl.ownerChooseHeading : sl.chooseHeading
        }
      >
        {options.map(option => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {option.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  {option.description}
                </span>
                {option.address ? (
                  <span className="mt-1.5 block text-xs leading-relaxed text-zinc-400">
                    {option.address}
                  </span>
                ) : null}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? 'border-white/40 bg-white/20'
                    : 'border-white/20 bg-transparent'
                }`}
                aria-hidden
              >
                {selected ? (
                  <CheckIcon className="h-3.5 w-3.5 text-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
