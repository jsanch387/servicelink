/**
 * Resolves service price/duration for the public /book calendar step.
 * When multi-price is on and options exist, requires a valid `priceOptionId`.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ResolvePublicBookingServiceFailure =
  | 'not_found'
  | 'price_option_required'
  | 'invalid_price_option';

export interface ResolvedPublicBookingService {
  serviceName: string;
  servicePriceCents: number;
  serviceDurationMinutes: number;
  /** True when the business turned on multi-price and has at least one active option. */
  priceOptionsRequired: boolean;
  selectedPriceOption: {
    id: string;
    label: string;
    priceCents: number;
    durationMinutes: number;
  } | null;
}

function durationFromServiceRow(row: {
  duration_minutes?: number | null;
  hours_to_complete?: number | null;
}): number {
  const minutes = row.duration_minutes;
  const hours = row.hours_to_complete;
  if (minutes != null && minutes > 0) return minutes;
  if (hours != null && hours > 0) return Math.round(hours * 60);
  return 60;
}

/**
 * Loads the active service and, when applicable, validates the selected price option.
 */
export async function resolvePublicBookingService(
  supabase: SupabaseClient<Database>,
  businessId: string,
  serviceId: string,
  priceOptionId?: string | null
): Promise<
  | { ok: true; data: ResolvedPublicBookingService }
  | { ok: false; reason: ResolvePublicBookingServiceFailure }
> {
  const { data: serviceRow, error: serviceError } = await supabase
    .from('business_services')
    .select(
      'name, price_cents, duration_minutes, hours_to_complete, price_options_enabled'
    )
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single();

  if (serviceError || !serviceRow) {
    return { ok: false, reason: 'not_found' };
  }

  const row = serviceRow as {
    name: string;
    price_cents: number | null;
    duration_minutes?: number | null;
    hours_to_complete?: number | null;
    price_options_enabled?: boolean;
  };

  const baseDuration = durationFromServiceRow(row);
  const basePrice = row.price_cents ?? 0;
  const name = row.name;
  const enabled = row.price_options_enabled === true;

  const { count, error: countError } = await supabase
    .from('service_price_options')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', serviceId)
    .eq('business_id', businessId)
    .eq('is_active', true);

  if (countError) {
    return { ok: false, reason: 'not_found' };
  }

  const optionCount = count ?? 0;
  const priceOptionsRequired = enabled && optionCount > 0;

  if (!priceOptionsRequired) {
    return {
      ok: true,
      data: {
        serviceName: name,
        servicePriceCents: basePrice,
        serviceDurationMinutes: Math.max(15, baseDuration),
        priceOptionsRequired: false,
        selectedPriceOption: null,
      },
    };
  }

  const trimmedOptionId = priceOptionId?.trim();
  if (!trimmedOptionId) {
    return { ok: false, reason: 'price_option_required' };
  }

  const { data: optRow, error: optError } = await supabase
    .from('service_price_options')
    .select('id, label, price_cents, duration_minutes')
    .eq('id', trimmedOptionId)
    .eq('service_id', serviceId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle();

  if (optError || !optRow) {
    return { ok: false, reason: 'invalid_price_option' };
  }

  const opt = optRow as {
    id: string;
    label: string;
    price_cents: number | null;
    duration_minutes: number | null;
  };

  return {
    ok: true,
    data: {
      serviceName: name,
      servicePriceCents: opt.price_cents ?? 0,
      serviceDurationMinutes: Math.max(
        15,
        opt.duration_minutes != null && opt.duration_minutes > 0
          ? opt.duration_minutes
          : baseDuration
      ),
      priceOptionsRequired: true,
      selectedPriceOption: {
        id: opt.id,
        label: opt.label,
        priceCents: opt.price_cents ?? 0,
        durationMinutes:
          opt.duration_minutes != null && opt.duration_minutes > 0
            ? opt.duration_minutes
            : baseDuration,
      },
    },
  };
}
