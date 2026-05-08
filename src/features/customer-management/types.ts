export type CustomerLifecycle = 'new' | 'returning';

export interface CustomerBookingAddOn {
  name: string;
  price: number;
}

/** Latest maintenance enrollment for CRM (from `maintenance_enrollments`). */
export interface CustomerMaintenanceEnrollmentSummary {
  enrollmentId: string;
  status: string;
  paymentStatus: string;
  serviceNameSnapshot: string;
  priceCents: number;
  frequencyWeeks: number;
  durationMinutes: number;
  anchorDate: string | null;
  anchorTime: string | null;
  /**
   * Raw invite token (same as URL path). Present for enrollments created after
   * `customer_invite_token` exists; null for older rows.
   */
  inviteToken: string | null;
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
  /** Completed maintenance-plan visits (from enrollment-linked bookings or maintenance-titled services). */
  maintenanceVisitsCompleted: number;
  status: CustomerLifecycle;
  note: string;
  /** Present when this customer has at least one enrollment row (latest by `created_at`). */
  maintenanceEnrollment?: CustomerMaintenanceEnrollmentSummary | null;
}

/** Payload for manually adding a customer (dashboard modal). */
export interface AddCustomerDraft {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

/** Aggregates for the customer list header (from bookings + customer rows when wired to API). */
export interface CustomerListStats {
  totalCustomers: number;
  returningCustomers: number;
  totalRevenue: number;
}
