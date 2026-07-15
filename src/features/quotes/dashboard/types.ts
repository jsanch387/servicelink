/** Mirrors `public.quote_status` — used for dashboard UI until wired to API. */
import type { QuoteAddonDetail } from '@/features/quotes/shared/quoteServiceSnapshot';

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
  /** Owner-authored message on the sent quote. */
  note: string | null;
  /** Customer request text (public “request quote”); not edited by owner flows. */
  requestMessage: string | null;
  vehicleLine: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  /** Where the service happens (optional at send; customer may add on approve). */
  serviceStreet: string | null;
  serviceUnit: string | null;
  serviceCity: string | null;
  serviceState: string | null;
  serviceZip: string | null;
  /** Legacy / display single line from DB. */
  serviceAddressLine: string | null;
  /** Catalog service id when quote used a saved service. */
  serviceId: string | null;
  /** Base service price (excludes add-ons) when catalog was used. */
  servicePriceCents: number | null;
  /** Denormalized add-ons snapshot (`quotes.addon_details`). */
  addonDetails: QuoteAddonDetail[] | null;
  /** Raw token for public URL `/q/[token]` (mock only). */
  publicToken: string;
}
