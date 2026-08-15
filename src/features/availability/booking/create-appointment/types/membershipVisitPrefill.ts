/** Prefill for owner Book visit from a membership subscriber. */
export type MembershipVisitPrefill = {
  membershipId: string;
  planName: string;
  visitDurationMinutes: number;
  customerName: string;
  email: string;
  phone: string;
  notes?: string;
  /** CRM / latest-booking address when available. */
  address?: {
    street: string;
    unit: string;
    city: string;
    state: string;
    zip: string;
  };
  vehicle?: {
    year: string;
    make: string;
    model: string;
  };
};
