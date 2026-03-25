export type CustomerLifecycle = 'new' | 'returning';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastService: string;
  /** Add-ons for the most recent booking only; omit or empty when none. */
  lastBookingAddOns?: string[];
  lastBookingDate: string;
  lastBookingDaysAgo: number;
  totalVisits: number;
  totalSpent: number;
  status: CustomerLifecycle;
  note: string;
}

/** Aggregates for the customer list header (from bookings + customer rows when wired to API). */
export interface CustomerListStats {
  totalCustomers: number;
  returningCustomers: number;
  totalRevenue: number;
}
