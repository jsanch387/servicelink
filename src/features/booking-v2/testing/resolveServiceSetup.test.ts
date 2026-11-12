import { describe, expect, it } from 'vitest';
import {
  computeSetupTotals,
  resolveServiceSetupVisibility,
} from '../utils/resolveServiceSetup';

describe('resolveServiceSetupVisibility', () => {
  it('asks for a pricing option before add-ons or the vehicle', () => {
    const hidden = resolveServiceSetupVisibility({
      priceOptionIds: ['sedan', 'suv'],
      addOnCount: 2,
      selectedPriceOptionId: null,
    });
    expect(hidden).toMatchObject({
      showPricing: true,
      showAddOns: false,
      showVehicle: false,
      showFooter: false,
    });

    const chosen = resolveServiceSetupVisibility({
      priceOptionIds: ['sedan', 'suv'],
      addOnCount: 2,
      selectedPriceOptionId: 'suv',
    });
    expect(chosen.showAddOns).toBe(true);
    expect(chosen.showVehicle).toBe(true);
    expect(chosen.showFooter).toBe(true);
  });

  it('hides a single pricing option and still asks for the vehicle', () => {
    const visibility = resolveServiceSetupVisibility({
      priceOptionIds: ['only'],
      addOnCount: 0,
      selectedPriceOptionId: null,
    });
    expect(visibility.showPricing).toBe(false);
    expect(visibility.autoPriceOptionId).toBe('only');
    expect(visibility.showVehicle).toBe(true);
  });

  it('shows the vehicle when there are no options and no add-ons', () => {
    const visibility = resolveServiceSetupVisibility({
      priceOptionIds: [],
      addOnCount: 0,
      selectedPriceOptionId: null,
    });
    expect(visibility.showPricing).toBe(false);
    expect(visibility.showAddOns).toBe(false);
    expect(visibility.showVehicle).toBe(true);
  });

  it('skips the vehicle section for home and personal services', () => {
    const visibility = resolveServiceSetupVisibility({
      priceOptionIds: [],
      addOnCount: 0,
      selectedPriceOptionId: null,
      collectsAsset: false,
    });
    expect(visibility.showVehicle).toBe(false);
    expect(visibility.showFooter).toBe(true);
  });
});

describe('computeSetupTotals', () => {
  it('adds selected add-ons and applies a percent sale to the sum', () => {
    const totals = computeSetupTotals({
      basePriceCents: 21000,
      baseDurationMinutes: 150,
      addOns: [
        {
          id: 'rain',
          name: 'Rain',
          priceCents: 7500,
          durationMinutes: 60,
        },
        {
          id: 'bay',
          name: 'Bay',
          priceCents: 6500,
          durationMinutes: 30,
        },
      ],
      selectedAddOnIds: ['rain', 'bay'],
      sale: {
        name: 'Summer',
        discountType: 'percentage',
        discountValue: 10,
      },
    });

    expect(totals.originalCents).toBe(35000);
    expect(totals.dueCents).toBe(31500);
    expect(totals.durationMinutes).toBe(240);
  });
});
