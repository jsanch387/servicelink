/**
 * Services API - Resolve add-on IDs to full add-on objects for public booking.
 * Server-only; used when passing addOnIds from details → book page.
 * Uses admin client so RLS does not block unauthenticated visitors.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export interface AddOnForBooking {
  id: string;
  name: string;
  priceCents: number;
  /** Extra appointment time when this add-on is selected; null/undefined = none. */
  durationMinutes?: number | null;
}

/**
 * Returns add-ons for the given IDs, scoped to the business.
 * Invalid or stale IDs are skipped.
 */
export async function getAddOnsByIdsForBooking(
  businessId: string,
  addonIds: string[]
): Promise<AddOnForBooking[]> {
  if (addonIds.length === 0) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const ids = [...new Set(addonIds)].filter(Boolean);

    const { data } = await supabase
      .from('service_addons')
      .select('id, name, price_cents, duration_minutes')
      .eq('business_id', businessId)
      .in('id', ids);

    return (data ?? []).map(
      (r: {
        id: string;
        name: string;
        price_cents: number;
        duration_minutes?: number | null;
      }) => ({
        id: r.id,
        name: r.name,
        priceCents: r.price_cents ?? 0,
        durationMinutes: r.duration_minutes ?? null,
      })
    );
  } catch {
    return [];
  }
}
