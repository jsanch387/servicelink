/**
 * Types for Availability Booking dashboard (V2) – owner view.
 * UI / mock only. Kept separate from request booking.
 */

export type AvailabilityBookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface AvailabilityBookingAddress {
  street: string;
  unitApt?: string;
  city: string;
  state: string;
  zip: string;
}

export interface AvailabilityBookingDisplay {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents: number | null;
  date: string;
  time: string;
  status: AvailabilityBookingStatus;
  address: AvailabilityBookingAddress;
  notes: string;
  createdAt: string;
}
