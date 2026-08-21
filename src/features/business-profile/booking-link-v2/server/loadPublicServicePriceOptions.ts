import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { PublicServicePriceOption } from '../types/publicServicePriceOption';

export type { PublicServicePriceOption };

export async function loadPublicServicePriceOptions(args: {
  businessId: string;
  serviceId: string;
}): Promise<PublicServicePriceOption[]> {
  const supabase = createSupabaseAdminClient();

  const { data: serviceRow, error: serviceError } = await supabase
    .from('business_services')
    .select('id, price_options_enabled')
    .eq('id', args.serviceId)
    .eq('business_id', args.businessId)
    .eq('is_active', true)
    .maybeSingle();

  if (serviceError || !serviceRow) return [];

  const optionsEnabled =
    (serviceRow as { price_options_enabled?: boolean }).price_options_enabled ===
    true;
  if (!optionsEnabled) return [];

  const ownerPro = await ownerHasProAccessForBusiness(
    supabase,
    args.businessId
  );
  if (!ownerPro) return [];

  const { data: optionRows } = await supabase
    .from('service_price_options')
    .select('id, label, price_cents, duration_minutes')
    .eq('service_id', args.serviceId)
    .eq('business_id', args.businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (optionRows ?? []).map(row => ({
    id: row.id,
    label: row.label,
    priceCents: row.price_cents ?? 0,
    durationMinutes: Math.max(1, row.duration_minutes ?? 0),
  }));
}
