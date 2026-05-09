/**
 * Derives lightweight public-booking hints (configure vs calendar) for services.
 * Mirrors `getServiceWithAddOnsForBooking` / book page rules without loading full rows.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/libs/supabase/client';

export type PublicBookingLoadHint = 'configure' | 'calendar';

export type ServiceRowWithPublicBookingHint<
  T extends { id: string; price_options_enabled?: boolean | null },
> = T & { public_booking_load_hint: PublicBookingLoadHint };

/**
 * Counts active price options and assigned add-ons (active add-on pool) per service.
 */
export async function enrichServicesWithPublicBookingLoadHints<
  T extends { id: string; price_options_enabled?: boolean | null },
>(
  admin: SupabaseClient<Database>,
  businessId: string,
  services: T[],
  ownerHasPro: boolean
): Promise<ServiceRowWithPublicBookingHint<T>[]> {
  const serviceIds = services.map(s => s.id).filter(Boolean);
  const priceOptionCount = new Map<string, number>();
  const addonCount = new Map<string, number>();

  if (serviceIds.length > 0) {
    const [{ data: priceRows }, { data: assignRows }] = await Promise.all([
      admin
        .from('service_price_options')
        .select('service_id')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .in('service_id', serviceIds),
      admin
        .from('service_addon_assignments')
        .select('service_id, addon_id')
        .in('service_id', serviceIds),
    ]);

    for (const r of priceRows ?? []) {
      const sid = (r as { service_id: string }).service_id;
      priceOptionCount.set(sid, (priceOptionCount.get(sid) ?? 0) + 1);
    }

    const addonIds = [
      ...new Set(
        (assignRows ?? []).map((r: { addon_id: string }) => r.addon_id)
      ),
    ].filter(Boolean);

    if (addonIds.length > 0) {
      const { data: validAddonRows } = await admin
        .from('service_addons')
        .select('id')
        .eq('business_id', businessId)
        .in('id', addonIds);

      const validAddon = new Set(
        (validAddonRows ?? []).map((r: { id: string }) => r.id)
      );

      for (const r of assignRows ?? []) {
        const row = r as { service_id: string; addon_id: string };
        if (!validAddon.has(row.addon_id)) continue;
        addonCount.set(
          row.service_id,
          (addonCount.get(row.service_id) ?? 0) + 1
        );
      }
    }
  }

  return services.map(service => {
    const priceOpts = priceOptionCount.get(service.id) ?? 0;
    const needsPriceStep =
      service.price_options_enabled === true && ownerHasPro && priceOpts > 0;
    const needsAddons = (addonCount.get(service.id) ?? 0) > 0;
    const needsConfigure = needsPriceStep || needsAddons;
    return {
      ...service,
      public_booking_load_hint: needsConfigure ? 'configure' : 'calendar',
    };
  });
}
