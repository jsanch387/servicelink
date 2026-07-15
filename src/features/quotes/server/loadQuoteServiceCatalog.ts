/**
 * Server-only: active services with price options + assigned add-ons for quote create.
 * Snapshots only — quotes still store free-text name / price / duration.
 */

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export type QuoteCatalogPriceOption = {
  id: string;
  label: string;
  priceCents: number;
  durationMinutes: number;
};

export type QuoteCatalogAddOn = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number | null;
};

export type QuoteCatalogService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  categoryId: string | null;
  priceOptionsEnabled: boolean;
  priceOptions: QuoteCatalogPriceOption[];
  addOns: QuoteCatalogAddOn[];
};

function resolveDurationMinutes(row: {
  duration_minutes?: number | null;
  hours_to_complete?: number | null;
}): number {
  if (row.duration_minutes != null && row.duration_minutes > 0) {
    return row.duration_minutes;
  }
  if (row.hours_to_complete != null && row.hours_to_complete > 0) {
    return Math.round(row.hours_to_complete * 60);
  }
  return 60;
}

export async function loadQuoteServiceCatalog(
  supabase: SupabaseClient,
  businessId: string
): Promise<QuoteCatalogService[]> {
  noStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: serviceRows, error } = await db
    .from('business_services')
    .select(
      'id, name, description, price_cents, duration_minutes, hours_to_complete, price_options_enabled, category_id, sort_order, created_at'
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !serviceRows?.length) {
    return [];
  }

  const services = serviceRows as Array<{
    id: string;
    name: string;
    description: string | null;
    price_cents: number | null;
    duration_minutes: number | null;
    hours_to_complete: number | null;
    price_options_enabled: boolean | null;
    category_id: string | null;
  }>;

  const serviceIds = services.map(s => s.id);
  const ownerPro = await ownerHasProAccessForBusiness(supabase, businessId);

  const optionsByService = new Map<string, QuoteCatalogPriceOption[]>();
  if (ownerPro) {
    const { data: optionRows } = await db
      .from('service_price_options')
      .select(
        'id, service_id, label, price_cents, duration_minutes, sort_order, created_at'
      )
      .eq('business_id', businessId)
      .eq('is_active', true)
      .in('service_id', serviceIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    for (const row of (optionRows ?? []) as Array<{
      id: string;
      service_id: string;
      label: string;
      price_cents: number | null;
      duration_minutes: number | null;
    }>) {
      const list = optionsByService.get(row.service_id) ?? [];
      list.push({
        id: row.id,
        label: row.label,
        priceCents: row.price_cents ?? 0,
        durationMinutes: Math.max(1, row.duration_minutes ?? 0),
      });
      optionsByService.set(row.service_id, list);
    }
  }

  const { data: assignmentRows } = await db
    .from('service_addon_assignments')
    .select('service_id, addon_id')
    .in('service_id', serviceIds);

  const assignments = (assignmentRows ?? []) as Array<{
    service_id: string;
    addon_id: string;
  }>;
  const addonIds = [...new Set(assignments.map(a => a.addon_id))];

  const addOnsById = new Map<string, QuoteCatalogAddOn>();
  if (addonIds.length > 0) {
    const { data: addonRows } = await db
      .from('service_addons')
      .select('id, name, price_cents, duration_minutes')
      .eq('business_id', businessId)
      .in('id', addonIds);

    for (const row of (addonRows ?? []) as Array<{
      id: string;
      name: string;
      price_cents: number | null;
      duration_minutes?: number | null;
    }>) {
      addOnsById.set(row.id, {
        id: row.id,
        name: row.name,
        priceCents: row.price_cents ?? 0,
        durationMinutes: row.duration_minutes ?? null,
      });
    }
  }

  const addOnsByService = new Map<string, QuoteCatalogAddOn[]>();
  for (const a of assignments) {
    const addon = addOnsById.get(a.addon_id);
    if (!addon) continue;
    const list = addOnsByService.get(a.service_id) ?? [];
    list.push(addon);
    addOnsByService.set(a.service_id, list);
  }

  return services.map(s => {
    const storedOptionsOn = s.price_options_enabled === true;
    const priceOptionsEnabled = storedOptionsOn && ownerPro;
    const priceOptions = priceOptionsEnabled
      ? (optionsByService.get(s.id) ?? [])
      : [];

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      priceCents: s.price_cents ?? 0,
      durationMinutes: resolveDurationMinutes(s),
      categoryId: s.category_id ?? null,
      priceOptionsEnabled: priceOptionsEnabled && priceOptions.length > 0,
      priceOptions,
      addOns: addOnsByService.get(s.id) ?? [],
    };
  });
}
