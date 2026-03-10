/**
 * Services API - Resolve add-on IDs to full add-on objects for public booking.
 * Server-only; used when passing addOnIds from details → book page.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';

export interface AddOnForBooking {
  id: string;
  name: string;
  priceCents: number;
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
    const supabase = await createSupabaseServerClient();
    const ids = [...new Set(addonIds)].filter(Boolean);

    const { data } = await supabase
      .from('service_addons')
      .select('id, name, price_cents')
      .eq('business_id', businessId)
      .in('id', ids);

    return (data ?? []).map(
      (r: { id: string; name: string; price_cents: number }) => ({
        id: r.id,
        name: r.name,

        priceCents: r.price_cents ?? 0,
      })
    );
  } catch {
    return [];
  }
}
