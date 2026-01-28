/**
 * Booking Request Types
 *
 * Types for the booking request feature.
 */

export interface BookingRequestFormData {
  name: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  service: string;
  message?: string;
}

export interface BookingRequestSubmitData extends BookingRequestFormData {
  businessId?: string;
  businessSlug?: string;
  submittedAt: string;
}

/**
 * Booking Request as stored in database
 */
export interface BookingRequest {
  id: string;
  business_id: string;
  business_slug: string | null;
  service_id: string | null;
  service_name: string;
  service_price_cents: number | null;
  customer_name: string;
  customer_phone: string;
  preferred_date: string;
  preferred_time_window: 'morning' | 'afternoon' | 'evening';
  message: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  status_updated_at: string | null;
  status_notes: string | null;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  notification_sent: boolean;
  notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Booking Request for dashboard display
 */
export interface BookingRequestDisplay {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  servicePrice: number | null; // in cents
  preferredDate: string;
  preferredTimeWindow: 'morning' | 'afternoon' | 'evening';
  message: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  statusUpdatedAt: string | null;
  statusNotes: string | null;
  submittedAt: string;
  createdAt: string;
}
