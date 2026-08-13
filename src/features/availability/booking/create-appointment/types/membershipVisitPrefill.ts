/** Prefill for owner Book visit from a membership subscriber. */
export type MembershipVisitPrefill = {
  membershipId: string;
  planName: string;
  visitDurationMinutes: number;
  customerName: string;
  email: string;
  phone: string;
  notes?: string;
  vehicle?: {
    year: string;
    make: string;
    model: string;
  };
};
