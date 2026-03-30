import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { ServicePriceOptionRow } from '../types/services';

export interface GetServicePriceOptionsResult {
  success: boolean;
  data: ServicePriceOptionRow[] | null;
  error: string | null;
}

/**
 * Read-only fetch for a service's price options, ordered for display.
 */
export async function getServicePriceOptions(
  serviceId: string,
  businessId: string
): Promise<GetServicePriceOptionsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('service_price_options')
      .select(
        'id, service_id, business_id, label, price_cents, duration_minutes, sort_order, is_active, created_at, updated_at'
      )
      .eq('service_id', serviceId)
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: (data as ServicePriceOptionRow[] | null) ?? [],
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch service price options',
    };
  }
}
