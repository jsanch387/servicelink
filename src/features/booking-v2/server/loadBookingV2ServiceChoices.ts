import type { PublicBookingFlowLocale } from '@/constants/routes';
import { sortServicesForDisplay } from '@/features/services/categories/utils/sortServicesForDisplay';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import type { ServiceRow } from '@/features/services/types/services';
import { localizedServiceCopy } from '@/features/services/utils/localizedServiceCopy';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingV2ServiceChoice = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number | null;
  priceOptionsEnabled: boolean;
  category_id: string | null;
};

export async function loadBookingV2ServiceChoices(
  db: SupabaseClient,
  businessId: string,
  locale: PublicBookingFlowLocale,
  ownerHasPro: boolean
): Promise<{
  services: BookingV2ServiceChoice[];
  categories: ServiceCategoryRow[];
}> {
  const [servicesQuery, categoriesQuery] = await Promise.all([
    db
      .from('business_services')
      .select(
        'id, name, description, name_es, description_es, price_cents, price_options_enabled, hours_to_complete, duration_minutes, category_id, sort_order, created_at'
      )
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    db
      .from('service_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (servicesQuery.error) {
    console.error('Error fetching booking v2 services:', servicesQuery.error);
  }

  const categories = (categoriesQuery.data ?? []) as ServiceCategoryRow[];
  const sorted = sortServicesForDisplay(
    (servicesQuery.data ?? []) as ServiceRow[],
    categories
  );

  const services = sorted.flatMap(row => {
    const name = localizedServiceCopy(locale, row).name.trim();
    if (!row.id || !name) return [];
    const durationMinutes =
      row.duration_minutes != null && row.duration_minutes > 0
        ? row.duration_minutes
        : row.hours_to_complete != null && row.hours_to_complete > 0
          ? Math.round(row.hours_to_complete * 60)
          : null;
    return [
      {
        id: row.id,
        name,
        priceCents: row.price_cents ?? 0,
        durationMinutes,
        priceOptionsEnabled: row.price_options_enabled === true && ownerHasPro,
        category_id: row.category_id ?? null,
      },
    ];
  });

  return { services, categories };
}
