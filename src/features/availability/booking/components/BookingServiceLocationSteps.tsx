'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { CustomerServiceChoice } from '../utils/bookingServiceLocationFlow';

export function BookingServiceLocationChoice({
  value,
  onChange,
  bookingFlowLocale = 'en',
}: {
  value: CustomerServiceChoice;
  onChange: (choice: 'mobile' | 'shop') => void;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  const sl = publicBookingUi(bookingFlowLocale).serviceLocation;

  const options: {
    id: 'mobile' | 'shop';
    title: string;
    description: string;
  }[] = [
    {
      id: 'mobile',
      title: sl.mobileOption,
      description: sl.mobileOptionDesc,
    },
    {
      id: 'shop',
      title: sl.shopOption,
      description: sl.shopOptionDesc,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{sl.chooseHeading}</h2>
        <p className="mt-1 text-sm text-zinc-500">{sl.chooseSubtitle}</p>
      </div>

      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={sl.chooseHeading}
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
              className={`w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left transition-colors ${
                selected
                  ? 'border-white/20 bg-white/[0.08]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'
              }`}
            >
              <span className="block text-sm font-semibold text-white">
                {option.title}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
