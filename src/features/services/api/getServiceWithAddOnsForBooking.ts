/**
 * Services API - Get service + its assigned add-ons for public booking.
 * Server-only; used by the book/details page.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';

export interface ServiceForBooking {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
}

export interface AddOnForBooking {
  id: string;
  name: string;
  priceCents: number;
}

export interface ServiceWithAddOnsForBooking {
  service: ServiceForBooking;
  addOns: AddOnForBooking[];
}

/**
 * Returns service details and add-ons assigned to that service for public booking.
 * Only returns is_active services. Add-ons come from service_addon_assignments + service_addons.
 */
export async function getServiceWithAddOnsForBooking(
  businessId: string,
  serviceId: string
): Promise<ServiceWithAddOnsForBooking | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: serviceRow, error: serviceError } = await supabase
      .from('business_services')
      .select(
        'id, name, description, price_cents, duration_minutes, hours_to_complete'
      )
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();

    if (serviceError || !serviceRow) return null;

    const durationMinutes =
      (serviceRow as { duration_minutes?: number | null }).duration_minutes ??
      ((serviceRow as { hours_to_complete?: number | null })
        .hours_to_complete != null
        ? Math.round(
            (serviceRow as { hours_to_complete: number }).hours_to_complete * 60
          )
        : 60);

    const { data: assignmentRows } = await supabase
      .from('service_addon_assignments')
      .select('addon_id')
      .eq('service_id', serviceId);

    const addonIds = (assignmentRows ?? []).map(
      (r: { addon_id: string }) => r.addon_id
    );

    let addOns: AddOnForBooking[] = [];

    if (addonIds.length > 0) {
      const { data: addonRows } = await supabase
        .from('service_addons')
        .select('id, name, price_cents')
        .eq('business_id', businessId)
        .in('id', addonIds);

      addOns = (addonRows ?? []).map(
        (r: { id: string; name: string; price_cents: number }) => ({
          id: r.id,
          name: r.name,
          priceCents: r.price_cents ?? 0,
        })
      );
    }

    const service: ServiceForBooking = {
      id: (serviceRow as { id: string }).id,
      name: (serviceRow as { name: string }).name,
      description: (serviceRow as { description: string | null }).description,
      priceCents:
        (serviceRow as { price_cents: number | null }).price_cents ?? 0,
      durationMinutes,
    };

    return { service, addOns };
  } catch {
    return null;
  }
}
