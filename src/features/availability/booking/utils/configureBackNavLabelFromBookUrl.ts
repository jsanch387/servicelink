import type { BookDetailsStepQuery } from '@/constants/routes';

/** Subset of `publicBookingUi().nav` used for configure-step back copy. */
export type PublicBookingConfigureBackNav = {
  backToAddOns: string;
  backToOptions: string;
  backToService: string;
};

/**
 * Same rules as `/[slug]/book` for “back” from the calendar into configure:
 * explicit `detailsStep`, else infer add-ons from `addOnIds`, else treat as service / price entry.
 */
export function configureBackNavLabelFromBookUrl(
  href: string,
  nav: PublicBookingConfigureBackNav
): string {
  const u = href.startsWith('http')
    ? new URL(href)
    : new URL(href, 'https://book.local');
  const raw = u.searchParams.get('detailsStep')?.trim();
  const detailsStep: BookDetailsStepQuery | undefined =
    raw === 'addons' || raw === 'price' ? raw : undefined;
  const addOnIdsRaw = u.searchParams.get('addOnIds')?.trim();
  const addonIdList = addOnIdsRaw
    ? addOnIdsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const priceOptionId = u.searchParams.get('priceOptionId')?.trim();
  const effectiveDetailsStep: BookDetailsStepQuery | undefined =
    detailsStep ?? (addonIdList.length > 0 ? 'addons' : undefined);

  if (effectiveDetailsStep === 'addons') return nav.backToAddOns;
  if (effectiveDetailsStep === 'price' && priceOptionId)
    return nav.backToOptions;
  return nav.backToService;
}
