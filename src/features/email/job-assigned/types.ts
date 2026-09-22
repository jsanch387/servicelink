export interface JobAssignedEmailPayload {
  businessName: string;
  customerName: string;
  serviceName: string;
  scheduledDateLabel: string;
  startTimeLabel: string;
  bookingsUrl: string;
}

export type SendJobAssignedEmailResult =
  | { sent: true; messageId?: string }
  | { sent: false; error: string };
