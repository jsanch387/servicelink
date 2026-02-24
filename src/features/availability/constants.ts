/**
 * Feature flag for Availability (owner settings).
 * Set to false to hide the Availability nav item and disable the page.
 */
export const AVAILABILITY_FEATURE_ENABLED = true;

/**
 * Feature flag for Availability-based Booking (customer flow).
 * When true: Book Now → date/time + form → success (no backend).
 * When false: Book Now → existing request booking flow.
 */
export const AVAILABILITY_BOOKING_ENABLED = true;
