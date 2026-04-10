import type { DashboardQuote } from '../types';

export interface QuotesListResponse {
  success: boolean;
  quotes?: DashboardQuote[];
  error?: string;
}

export interface QuoteDetailResponse {
  success: boolean;
  quote?: DashboardQuote;
  error?: string;
}

export interface QuoteDbRow {
  id: string;
  status: string;
  source: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_name: string | null;
  price_cents: number | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  note: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  customer_street_address: string | null;
  customer_unit_apt: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  service_address: string | null;
}

export interface QuotePublicLinkRow {
  quote_id: string;
  token_hash: string;
  is_active: boolean;
  revoked_at: string | null;
  expires_at: string;
  created_at: string;
}
