'use client';

import { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { BookingRow } from './BookingRow';

interface BookingsListProps {
  bookings: BookingRequest[];
  onAction?: (id: string, action: 'approved' | 'declined') => void;
  updatingIds?: Set<string>;
}

export function BookingsList({
  bookings,
  onAction,
  updatingIds = new Set(),
}: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-zinc-700" />
        </div>
        <h3 className="text-zinc-300 font-bold">No bookings found</h3>
        <p className="text-zinc-500 text-sm mt-1">
          Try switching your filter or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20 sm:pb-24 w-full">
      {/* Compact list layout */}
      <div className="space-y-2">
        {bookings.map(booking => (
          <BookingRow
            key={booking.id}
            booking={booking}
            onAction={onAction}
            isUpdating={updatingIds.has(booking.id)}
          />
        ))}
      </div>
    </div>
  );
}
