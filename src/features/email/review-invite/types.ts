export interface ReviewInviteEmailPayload {
  customerName: string;
  businessName: string;
  serviceName: string;
  /** `YYYY-MM-DD` */
  scheduledDate: string;
  /** Wall time from booking (`HH:mm` or `HH:mm:ss`). */
  scheduledStartTime: string;
  publicReviewUrl: string;
}

export type SendReviewInviteEmailResult =
  | { sent: true }
  | { sent: false; error: string };
