'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Single source of truth for "Accept Bookings" (Availability page toggle).
 * When true: business uses availability booking (calendar/time slots); Bookings page shows V2.
 * When false: business receives request bookings; Bookings page shows V1.
 * Persisted so Bookings page shows the correct view without the toggle living there.
 */
interface AvailabilityBookingState {
  /** Same as "Accept Bookings" on dashboard/availability. */
  acceptBookings: boolean;

  setAcceptBookings: (value: boolean) => void;
}

export const useAvailabilityBookingStore = create<AvailabilityBookingState>()(
  persist(
    set => ({
      acceptBookings: true,
      setAcceptBookings: value => set({ acceptBookings: value }),
    }),
    {
      name: 'availability-booking-store',
      partialize: s => ({ acceptBookings: s.acceptBookings }),
    }
  )
);
