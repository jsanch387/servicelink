import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SaveServicePriceOptionsResult,
  ServicePriceOptionSaveInput,
} from '../types/services';

/**
 * Replaces all price options for a service with the provided ordered list.
 * Caller must ensure payload validation (name/price/duration required).
 */
export async function saveServicePriceOptions(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  businessId: string,
  options: ServicePriceOptionSaveInput[]
): Promise<SaveServicePriceOptionsResult> {
  try {
    // Clear previous options for this service/business scope.
    const { error: deleteError } = await supabase
      .from('service_price_options')
      .delete()
      .eq('service_id', serviceId)
      .eq('business_id', businessId);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message ?? 'Failed to clear previous price options',
      };
    }

    if (options.length === 0) {
      return { success: true, error: null };
    }

    type InsertRow =
      Database['public']['Tables']['service_price_options']['Insert'];
    const rows: InsertRow[] = options.map((o, index) => ({
      service_id: serviceId,
      business_id: businessId,
      label: o.label,
      price_cents: o.price_cents,
      duration_minutes: o.duration_minutes,
      sort_order: o.sort_order ?? index,
      is_active: o.is_active ?? true,
    }));

    const { error: insertError } = await supabase
      .from('service_price_options')
      .insert(rows as never);

    if (insertError) {
      return {
        success: false,
        error: insertError.message ?? 'Failed to save price options',
      };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to save price options',
    };
  }
}
