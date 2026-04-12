/**
 * Services API - Get service + its assigned add-ons for public booking.
 * Server-only; used by the book/details page. Uses admin client so RLS
 * does not block unauthenticated (signed-out) visitors.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export interface ServiceForBooking {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  /** When true and `priceOptions` is non-empty, customer must pick an option before booking. */
  priceOptionsEnabled: boolean;
}

export interface PriceOptionForBooking {
  id: string;
  label: string;
  priceCents: number;
  durationMinutes: number;
}

export interface AddOnForBooking {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
}

export interface ServiceWithAddOnsForBooking {
  service: ServiceForBooking;
  addOns: AddOnForBooking[];
  /** Active price options for this service (empty if none or feature off). */
  priceOptions: PriceOptionForBooking[];
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
    const supabase = createSupabaseAdminClient();

    const { data: serviceRow, error: serviceError } = await supabase
      .from('business_services')
      .select(
        'id, name, description, price_cents, duration_minutes, hours_to_complete, price_options_enabled'
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

    const priceOptionsEnabled =
      (serviceRow as { price_options_enabled?: boolean })
        .price_options_enabled === true;

    let priceOptions: PriceOptionForBooking[] = [];
    if (priceOptionsEnabled) {
      const { data: optionRows } = await supabase
        .from('service_price_options')
        .select(
          'id, label, price_cents, duration_minutes, sort_order, created_at'
        )
        .eq('service_id', serviceId)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      priceOptions = (optionRows ?? []).map(
        (r: {
          id: string;
          label: string;
          price_cents: number | null;
          duration_minutes: number | null;
        }) => ({
          id: r.id,
          label: r.label,
          priceCents: r.price_cents ?? 0,
          durationMinutes: Math.max(1, r.duration_minutes ?? 0),
        })
      );
    }

    let addOns: AddOnForBooking[] = [];

    if (addonIds.length > 0) {
      const { data: addonRows } = await supabase
        .from('service_addons')
        .select('id, name, price_cents, duration_minutes')
        .eq('business_id', businessId)
        .in('id', addonIds);

      addOns = (addonRows ?? []).map(
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
    }

    const service: ServiceForBooking = {
      id: (serviceRow as { id: string }).id,
      name: (serviceRow as { name: string }).name,
      description: (serviceRow as { description: string | null }).description,
      priceCents:
        (serviceRow as { price_cents: number | null }).price_cents ?? 0,
      durationMinutes,
      priceOptionsEnabled,
    };

    return { service, addOns, priceOptions };
  } catch {
    return null;
  }
}
