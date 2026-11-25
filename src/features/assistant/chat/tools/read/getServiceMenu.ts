import { loadQuoteServiceCatalog } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

const DESCRIPTION_PREVIEW_CHARS = 180;

export type GetServiceMenuResult =
  | {
      ok: true;
      serviceCount: number;
      categoryCount: number;
      missingDescriptionCount: number;
      priceRangeLabel: string | null;
      services: Array<{
        name: string;
        categoryName: string | null;
        description: string | null;
        hasDescription: boolean;
        priceLabel: string;
        durationMinutes: number;
        priceOptionCount: number;
        addOnCount: number;
        priceOptions: Array<{ label: string; priceLabel: string }>;
      }>;
    }
  | { ok: false; error: string };

/** Active service menu for this shop. `businessId` from session only. */
export async function executeGetServiceMenu(args: {
  businessId: string;
}): Promise<GetServiceMenuResult> {
  try {
    const admin = createSupabaseAdminClient();
    const catalog = await loadQuoteServiceCatalog(admin, args.businessId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categoryRows, error: categoryError } = await (admin as any)
      .from('service_categories')
      .select('id, name')
      .eq('business_id', args.businessId);

    if (categoryError) {
      console.error('[assistant:chat] getServiceMenu categories', categoryError);
    }

    const categoryNameById = new Map<string, string>();
    for (const row of (categoryRows ?? []) as Array<{
      id: string;
      name: string;
    }>) {
      categoryNameById.set(row.id, row.name);
    }

    const prices = catalog
      .map(service => {
        if (service.priceOptionsEnabled && service.priceOptions.length > 0) {
          return service.priceOptions.map(option => option.priceCents);
        }
        return [service.priceCents];
      })
      .flat()
      .filter(cents => cents > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const priceRangeLabel =
      minPrice == null || maxPrice == null
        ? null
        : minPrice === maxPrice
          ? formatPaymentDollars(minPrice)
          : `${formatPaymentDollars(minPrice)}–${formatPaymentDollars(maxPrice)}`;

    let missingDescriptionCount = 0;
    const services = catalog.map(service => {
      const description = service.description?.trim() || null;
      if (!description) missingDescriptionCount += 1;

      const priceLabel =
        service.priceOptionsEnabled && service.priceOptions.length > 0
          ? `from ${formatPaymentDollars(
              Math.min(...service.priceOptions.map(option => option.priceCents))
            )}`
          : formatPaymentDollars(service.priceCents);

      return {
        name: service.name,
        categoryName: service.categoryId
          ? (categoryNameById.get(service.categoryId) ?? null)
          : null,
        description: description
          ? description.length > DESCRIPTION_PREVIEW_CHARS
            ? `${description.slice(0, DESCRIPTION_PREVIEW_CHARS)}…`
            : description
          : null,
        hasDescription: Boolean(description),
        priceLabel,
        durationMinutes: service.durationMinutes,
        priceOptionCount: service.priceOptions.length,
        addOnCount: service.addOns.length,
        priceOptions: service.priceOptions.slice(0, 6).map(option => ({
          label: option.label,
          priceLabel: formatPaymentDollars(option.priceCents),
        })),
      };
    });

    return {
      ok: true,
      serviceCount: services.length,
      categoryCount: categoryNameById.size,
      missingDescriptionCount,
      priceRangeLabel,
      services,
    };
  } catch (error) {
    console.error('[assistant:chat] getServiceMenu', error);
    return { ok: false, error: 'Could not load your service menu right now.' };
  }
}
