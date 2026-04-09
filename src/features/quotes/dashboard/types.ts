/** Mirrors `public.quote_status` — used for dashboard UI until wired to API. */
export type DashboardQuoteStatus =
  | 'requested'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'cancelled';

export type DashboardQuoteSource = 'owner_created' | 'customer_requested';

export type QuotesDashboardFilterId = 'all' | 'open' | 'closed';

export interface DashboardQuote {
  id: string;
  status: DashboardQuoteStatus;
  source: DashboardQuoteSource;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  serviceName: string;
  totalCents: number;
  /** Service duration from `quotes.duration_minutes` (for edit + display). */
  durationMinutes: number;
  /** Best “activity” timestamp for list sorting (ISO). */
  activityAt: string;
  createdAt: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  note: string | null;
  vehicleLine: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  /** Raw token for public URL `/q/[token]` (mock only). */
  publicToken: string;
}
