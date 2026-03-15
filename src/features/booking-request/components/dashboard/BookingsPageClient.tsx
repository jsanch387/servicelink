'use client';

import { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { FreeBookingsTracker } from '@/features/pricing';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { BookingsHeader } from './BookingsHeader';
import { BookingsList } from './BookingsList';

interface BookingsPageClientProps {
  businessName: string;
  initialBookings: BookingRequest[];
  /** Free plan: bookings used this month (0–5). Shown in tracker. */
  freeBookingsUsed?: number;
  /** When false (Pro), hide the free bookings tracker. */
  showFreeBookingsTracker?: boolean;
}

// Sort bookings: pending first, then by submitted_at (newest first)
const sortBookings = (bookings: BookingRequest[]): BookingRequest[] => {
  return [...bookings].sort((a, b) => {
    // Pending requests always come first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    // Within the same status group, sort by submitted_at (newest first)
    const dateA = new Date(a.submitted_at || a.created_at).getTime();
    const dateB = new Date(b.submitted_at || b.created_at).getTime();
    return dateB - dateA;
  });
};

export function BookingsPageClient({
  businessName,
  initialBookings,
  freeBookingsUsed = 0,
  showFreeBookingsTracker = true,
}: BookingsPageClientProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>(
    sortBookings(initialBookings)
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'declined'
  >('all');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Handle status update
  const handleStatusUpdate = useCallback(
    async (id: string, action: 'approved' | 'declined') => {
      // Prevent duplicate updates
      if (updatingIds.has(id)) return;

      // Find the current booking to preserve original status for error rollback
      const currentBooking = bookings.find(b => b.id === id);
      if (!currentBooking) return;

      const newStatus = action === 'approved' ? 'approved' : 'declined';
      const originalStatus = currentBooking.status;

      // Optimistically update the UI
      setUpdatingIds(prev => new Set(prev).add(id));
      setBookings(prevBookings => {
        const updated = prevBookings.map(booking =>
          booking.id === id
            ? { ...booking, status: newStatus as BookingRequest['status'] }
            : booking
        );
        return sortBookings(updated);
      });

      try {
        const response = await fetch('/api/booking-request/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: id,
            status: newStatus,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to update booking request');
        }

        // Update with the server response to ensure consistency
        setBookings(prevBookings => {
          const updated = prevBookings.map(booking =>
            booking.id === id ? (result.data as BookingRequest) : booking
          );
          return sortBookings(updated);
        });
      } catch (error) {
        console.error('Error updating booking request:', error);

        // Revert optimistic update on error - restore original status
        setBookings(prevBookings => {
          const updated = prevBookings.map(booking =>
            booking.id === id
              ? {
                  ...booking,
                  status: originalStatus as BookingRequest['status'],
                }
              : booking
          );
          return sortBookings(updated);
        });

        // Show error to user (you could add a toast notification here)
        alert(
          error instanceof Error
            ? error.message
            : 'Failed to update booking request. Please try again.'
        );
      } finally {
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [updatingIds, bookings]
  );

  // Filter bookings by status (exclude cancelled from all views)
  const filteredBookings =
    statusFilter === 'all'
      ? bookings.filter(booking => booking.status !== 'cancelled')
      : bookings.filter(booking => booking.status === statusFilter);

  // Count bookings by status (excluding cancelled)
  const statusCounts = {
    all: bookings.filter(b => b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    declined: bookings.filter(b => b.status === 'declined').length,
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white w-full overflow-x-hidden">
      <BookingsHeader
        businessName={businessName}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
      />
      <main className="px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 max-w-xl lg:max-w-7xl mx-auto w-full">
        {/* Information Banner - Collapsible Alert Style */}
        <div className="mb-4 sm:mb-5">
          <div
            className="bg-white/5 border-l-4 border-orange-500 rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:bg-white/8"
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <InformationCircleIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    These are booking requests, not confirmed appointments
                  </h3>
                  {isInfoExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-orange-500/70 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-orange-500/70 flex-shrink-0" />
                  )}
                </div>
                {isInfoExpanded && (
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-2.5">
                    Contact each customer via phone or text to confirm details
                    like address, date, and time. Once you&apos;ve scheduled
                    with them, you can mark the request as{' '}
                    <span className="font-semibold text-white">Approved</span>,{' '}
                    <span className="font-semibold text-white">Declined</span>,
                    or leave it as{' '}
                    <span className="font-semibold text-white">Pending</span>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
          <h2 className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">
            {statusFilter} requests — {filteredBookings.length}
          </h2>
        </div>
        {showFreeBookingsTracker && (
          <FreeBookingsTracker
            bookingsUsed={freeBookingsUsed}
            className="mb-4"
          />
        )}
        <BookingsList
          bookings={filteredBookings}
          onAction={handleStatusUpdate}
          updatingIds={updatingIds}
        />
      </main>
    </div>
  );
}
