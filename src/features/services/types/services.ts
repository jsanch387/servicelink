/**
 * Services feature types.
 * Single source of truth for service data and API results.
 */

import type { Database } from '@/libs/supabase/client';

/** Database row for business_services table. */
export type ServiceRow =
  Database['public']['Tables']['business_services']['Row'];

/** Result of fetching services for a business. */
export interface GetServicesResult {
  success: boolean;
  data: ServiceRow[] | null;
  error: string | null;
}

/** Payload for updating a service (editable fields only). */
export interface UpdateServicePayload {
  name: string;
  description: string;
  price_cents: number | null;
  duration_minutes: number | null;
}

/** Result of updating a single service. */
export interface UpdateServiceResult {
  success: boolean;
  data: ServiceRow | null;
  error: string | null;
}
