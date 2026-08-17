export type AvailabilityBookingCanceledPayload = {
  businessName: string;
  customerName: string | null;
  serviceName: string;
  /** YYYY-MM-DD */
  scheduledDate: string;
  /** HH:mm or HH:mm:ss */
  startTime: string;
};

export type SendAvailabilityBookingCanceledResult =
  | { sent: true }
  | { sent: false; error: string };
