'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React from 'react';

interface BookingSuccessProps {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  date: string;
  time: string;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  businessName,
  businessSlug,
  serviceName,
  date,
  time,
}) => {
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center py-10 px-4 pb-16">
      {/* Green check */}
      <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25">
        <CheckIcon className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        Booking confirmed
      </h2>
      <p className="text-gray-400 text-sm mb-8 max-w-sm text-center">
        Your appointment with {businessName} has been requested.
      </p>

      {/* Details card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Your booking
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Service</p>
            <p className="text-white font-semibold">{serviceName}</p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Date</p>
            <p className="text-white font-medium">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Time</p>
            <p className="text-white font-medium">{time}</p>
          </div>
        </div>
      </div>

      <Link
        href={`/${businessSlug}`}
        className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
      >
        Back to profile
      </Link>
    </div>
  );
};
