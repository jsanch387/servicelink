export type MembershipVisitReminderKind =
  /** Automatic next-period reminder. */
  | 'period_started'
  /** Owner “Send schedule link” (e.g. after a canceled visit). */
  | 'schedule_link';

export type MembershipVisitReminderPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  /** Public schedule URL with signed token. */
  scheduleUrl: string;
  /**
   * Defaults to `period_started`.
   * Use `schedule_link` when the owner resends a booking link.
   */
  kind?: MembershipVisitReminderKind;
};

export type SendMembershipVisitReminderResult =
  | { sent: true }
  | { sent: false; error: string };
