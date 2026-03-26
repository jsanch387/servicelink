export type CustomerLifecycle = 'new' | 'returning';

export interface CustomerBookingAddOn {
  name: string;
  price: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastService: string;
  lastServicePrice?: number;
  /** Add-ons for the last completed visit; omit when none. */
  lastBookingAddOns?: string[];
  lastBookingAddOnDetails?: CustomerBookingAddOn[];
  /** Most recent completed visit (calendar date). */
  lastVisitDate: string | null;
  lastVisitDaysAgo: number | null;
  /** Earliest upcoming confirmed appointment (calendar date). */
  nextAppointmentDate: string | null;
  nextAppointmentDaysUntil: number | null;
  nextAppointmentService?: string;
  nextAppointmentServicePrice?: number;
  nextAppointmentAddOns?: string[];
  nextAppointmentAddOnDetails?: CustomerBookingAddOn[];
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
