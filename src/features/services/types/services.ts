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

/** Payload for creating a new service (same shape as update). */
export interface CreateServicePayload {
  name: string;
  description: string;
  price_cents: number | null;
  duration_minutes: number | null;
}

/** Result of creating a single service. */
export interface CreateServiceResult {
  success: boolean;
  data: ServiceRow | null;
  error: string | null;
}

/** Result of deleting a service. */
export interface DeleteServiceResult {
  success: boolean;
  error: string | null;
}

/** Result of updating a service's is_active flag. */
export interface UpdateServiceIsActiveResult {
  success: boolean;
  error: string | null;
}

/** Result of saving services sort order. */
export interface UpdateServicesOrderResult {
  success: boolean;
  error: string | null;
}
