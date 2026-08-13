export type MembershipVisitReminderPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  /** Public schedule URL with signed token. */
  scheduleUrl: string;
};

export type SendMembershipVisitReminderResult =
  | { sent: true }
  | { sent: false; error: string };
