import type { AddOnForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { getServiceSalePriceCents } from '@/features/marketing/utils/getServiceSalePriceCents';

export type ServiceSetupVisibility = {
  /** Two or more options: the customer must pick one. */
  showPricing: boolean;
  /** One option is chosen for them and the section stays hidden. */
  autoPriceOptionId: string | null;
  showAddOns: boolean;
  showVehicle: boolean;
  showFooter: boolean;
};

/**
 * Pricing first, then add-ons, then the vehicle or pet.
 * A single pricing option is selected and hidden.
 * Home and personal services skip that last section.
 * Vehicle and pet businesses still see it when a service has neither options nor add-ons.
 */
export function resolveServiceSetupVisibility(input: {
  priceOptionIds: string[];
  addOnCount: number;
  selectedPriceOptionId: string | null;
  /** Home and personal services skip the vehicle and pet section. */
  collectsAsset?: boolean;
}): ServiceSetupVisibility {
  const count = input.priceOptionIds.length;
  const autoPriceOptionId = count === 1 ? input.priceOptionIds[0] : null;
  const showPricing = count > 1;
  const priceReady =
    count === 0 ||
    autoPriceOptionId != null ||
    (input.selectedPriceOptionId != null &&
      input.priceOptionIds.includes(input.selectedPriceOptionId));
  const collectsAsset = input.collectsAsset !== false;

  return {
    showPricing,
    autoPriceOptionId,
    showAddOns: priceReady && input.addOnCount > 0,
    showVehicle: collectsAsset && priceReady,
    showFooter: priceReady,
  };
}

export function computeSetupTotals(input: {
  basePriceCents: number;
  baseDurationMinutes: number;
  addOns: AddOnForBooking[];
  selectedAddOnIds: string[];
  sale: PublicActiveSale | null;
}): {
  originalCents: number;
  dueCents: number;
  durationMinutes: number;
} {
  const selected = new Set(input.selectedAddOnIds);
  let originalCents = Math.max(0, input.basePriceCents);
  let durationMinutes = Math.max(0, input.baseDurationMinutes);

  for (const addOn of input.addOns) {
    if (!selected.has(addOn.id)) continue;
    originalCents += Math.max(0, addOn.priceCents);
    durationMinutes += Math.max(0, addOn.durationMinutes ?? 0);
  }

  const sale = getServiceSalePriceCents(originalCents, input.sale);
  return {
    originalCents,
    dueCents: sale?.saleCents ?? originalCents,
    durationMinutes,
  };
}
