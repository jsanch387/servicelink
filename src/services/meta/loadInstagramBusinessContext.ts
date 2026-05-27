/**
 * Step 2 context loader:
 * Pulls business-specific catalog + availability context for DM responses.
 */

import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { BusinessAvailabilityRow } from '@/features/availability/types/availability';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { normalizeBookingLink } from '@/services/meta/normalizeBookingLink';

export type InstagramContextServicePriceOption = {
  label: string;
  priceCents: number;
  durationMinutes: number;
};

export type InstagramContextAddOn = {
  name: string;
  priceCents: number;
  durationMinutes: number | null;
};

export type InstagramContextService = {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number | null;
  durationMinutes: number | null;
  priceOptions: InstagramContextServicePriceOption[];
  addOns: InstagramContextAddOn[];
};

export type InstagramBusinessContext = {
  businessId: string;
  businessSlug: string | null;
  businessType: string | null;
  businessName: string;
  serviceArea: string | null;
  /** Canonical https ServiceLink profile URL; null if slug/link not set. */
  bookingLink: string | null;
  services: InstagramContextService[];
  availability: Pick<
    BusinessAvailabilityRow,
    'accept_bookings' | 'minimum_notice' | 'weekly_schedule' | 'time_off_blocks'
  > | null;
};

type BusinessProfileRow = {
  id: string;
  business_name: string;
  business_type: string | null;
  service_area: string | null;
  business_slug: string | null;
  business_link: string | null;
};

type BusinessServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  duration_minutes: number | null;
  hours_to_complete: number | null;
};

type ServicePriceOptionRow = {
  service_id: string;
  label: string;
  price_cents: number;
  duration_minutes: number;
};

type ServiceAddOnRow = {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number | null;
};

type ServiceAddOnAssignmentRow = {
  service_id: string;
  addon_id: string;
};

function nonEmptyTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function loadInstagramBusinessContext(
  businessId: string
): Promise<InstagramBusinessContext> {
  const supabase = createSupabaseAdminClient();
  // Some newer tables are not fully represented in generated `Database` typings.
  // Use `any` query builder here and cast to local row shapes for context loading.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: businessProfile, error: businessError } = await db
    .from('business_profiles')
    .select(
      'id, business_name, business_type, service_area, business_slug, business_link'
    )
    .eq('id', businessId)
    .maybeSingle();

  if (businessError) {
    throw new Error(
      `Failed to load business profile for instagram context: ${businessError.message}`
    );
  }
  if (!businessProfile) {
    throw new Error(
      `Business profile not found for instagram context (business_id=${businessId})`
    );
  }

  const { data: serviceRows, error: servicesError } = await db
    .from('business_services')
    .select(
      'id, name, description, price_cents, duration_minutes, hours_to_complete, is_active, sort_order, created_at'
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (servicesError) {
    throw new Error(
      `Failed to load business services for instagram context: ${servicesError.message}`
    );
  }

  const profile = businessProfile as BusinessProfileRow | null;
  if (!profile) {
    throw new Error(
      `Business profile not found for instagram context (business_id=${businessId})`
    );
  }
  const services = (serviceRows ?? []) as BusinessServiceRow[];
  const serviceIds = services.map(service => service.id);

  const { data: optionRows, error: optionsError } = serviceIds.length
    ? await db
        .from('service_price_options')
        .select(
          'service_id, label, price_cents, duration_minutes, is_active, sort_order, created_at'
        )
        .eq('business_id', businessId)
        .eq('is_active', true)
        .in('service_id', serviceIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
    : { data: [], error: null };

  const { data: addOnRows, error: addOnsError } = await db
    .from('service_addons')
    .select('id, name, price_cents, duration_minutes')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  const { data: assignmentRows, error: assignmentsError } = serviceIds.length
    ? await db
        .from('service_addon_assignments')
        .select('service_id, addon_id')
        .in('service_id', serviceIds)
    : { data: [], error: null };

  const availabilityRow = await getAvailabilityForBusiness(
    supabase,
    businessId
  );

  if (optionsError) {
    throw new Error(
      `Failed to load service price options for instagram context: ${optionsError.message}`
    );
  }
  if (addOnsError) {
    throw new Error(
      `Failed to load service add-ons for instagram context: ${addOnsError.message}`
    );
  }
  if (assignmentsError) {
    throw new Error(
      `Failed to load add-on assignments for instagram context: ${assignmentsError.message}`
    );
  }

  const optionsByServiceId = new Map<
    string,
    InstagramContextServicePriceOption[]
  >();
  for (const row of (optionRows ?? []) as ServicePriceOptionRow[]) {
    const list = optionsByServiceId.get(row.service_id) ?? [];
    list.push({
      label: row.label,
      priceCents: row.price_cents,
      durationMinutes: row.duration_minutes,
    });
    optionsByServiceId.set(row.service_id, list);
  }

  const addOnById = new Map<string, InstagramContextAddOn>();
  for (const row of (addOnRows ?? []) as ServiceAddOnRow[]) {
    addOnById.set(row.id, {
      name: row.name,
      priceCents: row.price_cents,
      durationMinutes: row.duration_minutes,
    });
  }

  const addOnsByServiceId = new Map<string, InstagramContextAddOn[]>();
  for (const row of (assignmentRows ?? []) as ServiceAddOnAssignmentRow[]) {
    const addOn = addOnById.get(row.addon_id);
    if (!addOn) continue;
    const list = addOnsByServiceId.get(row.service_id) ?? [];
    list.push(addOn);
    addOnsByServiceId.set(row.service_id, list);
  }

  const contextServices: InstagramContextService[] = services.map(service => ({
    id: service.id,
    name: service.name,
    description: nonEmptyTrimmed(service.description),
    basePriceCents: service.price_cents,
    durationMinutes:
      service.duration_minutes ??
      (service.hours_to_complete != null
        ? Math.round(service.hours_to_complete * 60)
        : null),
    priceOptions: optionsByServiceId.get(service.id) ?? [],
    addOns: addOnsByServiceId.get(service.id) ?? [],
  }));

  const bookingLink = normalizeBookingLink(
    profile.business_link,
    profile.business_slug
  );

  return {
    businessId,
    businessSlug: nonEmptyTrimmed(profile.business_slug),
    businessType: nonEmptyTrimmed(profile.business_type),
    businessName: profile.business_name,
    serviceArea: nonEmptyTrimmed(profile.service_area),
    bookingLink,
    services: contextServices,
    availability: availabilityRow
      ? {
          accept_bookings: availabilityRow.accept_bookings,
          minimum_notice: availabilityRow.minimum_notice,
          weekly_schedule: availabilityRow.weekly_schedule,
          time_off_blocks: availabilityRow.time_off_blocks ?? [],
        }
      : null,
  };
}
