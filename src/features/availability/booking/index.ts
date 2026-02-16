/**
 * Availability Booking (customer flow) – POC.
 * Single page: service summary, date, time, form, confirm.
 * Gated by AVAILABILITY_BOOKING_ENABLED.
 */

export { AvailabilityBookingPage } from './components/AvailabilityBookingPage';
export { MOCK_WEEKLY_SCHEDULE, getMockExistingBookingsForMonth } from './mockData';
export type {
  AvailabilityBookingPageProps,
  BookingSubmission,
  CustomerFormData,
  ExistingBooking,
  ServiceSummary,
} from './types';
