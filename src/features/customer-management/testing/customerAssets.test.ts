import { describe, expect, it } from 'vitest';
import {
  buildVehicleAssetDraft,
  vehicleAssetFingerprint,
  vehicleAssetLabel,
} from '../utils/customerAssetTypes';
import { collectVehicleAssetsFromBooking } from '../server/upsertCustomerAssets';

describe('customer asset helpers', () => {
  it('builds a stable fingerprint ignoring case/spacing', () => {
    expect(vehicleAssetFingerprint('2018', 'Toyota', 'Camry')).toBe(
      '2018|toyota|camry'
    );
    expect(vehicleAssetFingerprint('2018', '  Toyota  ', 'Camry')).toBe(
      vehicleAssetFingerprint('2018', 'toyota', 'camry')
    );
  });

  it('builds a display label', () => {
    expect(vehicleAssetLabel('2018', 'Toyota', 'Camry')).toBe(
      '2018 Toyota Camry'
    );
  });

  it('rejects incomplete vehicle drafts', () => {
    expect(
      buildVehicleAssetDraft({ year: '2018', make: 'Toyota', model: '' })
    ).toBeNull();
  });

  it('dedupes vehicles from customer + jobs', () => {
    const assets = collectVehicleAssetsFromBooking({
      customerVehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
      jobVehicles: [
        { year: '2018', make: 'toyota', model: 'Camry' },
        { year: '2020', make: 'Honda', model: 'Civic' },
        { year: '', make: '', model: '' },
      ],
    });
    expect(assets).toHaveLength(2);
    expect(assets.map(a => a.label)).toEqual([
      '2018 Toyota Camry',
      '2020 Honda Civic',
    ]);
  });
});
