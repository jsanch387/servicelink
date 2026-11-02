export type AvailabilityBookingRescheduledPayload = {
  businessName: string;
  customerName: string | null;
  serviceName: string;
  /** New visit date, YYYY-MM-DD */
  scheduledDate: string;
  /** New visit time, HH:mm or HH:mm:ss */
  startTime: string;
  /** Previous visit date, YYYY-MM-DD */
  previousScheduledDate: string | null;
  /** Previous visit time, HH:mm or HH:mm:ss */
  previousStartTime: string | null;
};

export type SendAvailabilityBookingRescheduledResult =
  | { sent: true }
  | { sent: false; error: string };
