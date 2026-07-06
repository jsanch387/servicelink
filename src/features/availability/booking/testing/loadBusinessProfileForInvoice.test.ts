import { describe, expect, it } from 'vitest';
import { invoiceSnapshotNeedsBusinessHydration } from '@/features/availability/booking/utils/invoiceSnapshotBusiness';

describe('invoiceSnapshotNeedsBusinessHydration', () => {
  it('detects placeholder business name', () => {
    expect(
      invoiceSnapshotNeedsBusinessHydration({
        business: { name: 'Your provider', profileUrl: null },
      })
    ).toBe(true);
  });

  it('detects missing profile URL even when name is present', () => {
    expect(
      invoiceSnapshotNeedsBusinessHydration({
        business: { name: 'Black Label Detail', profileUrl: null },
      })
    ).toBe(true);
  });

  it('returns false when name and profile URL are present', () => {
    expect(
      invoiceSnapshotNeedsBusinessHydration({
        business: {
          name: 'Black Label Detail',
          profileUrl: 'https://myservicelink.app/black-label-detail',
        },
      })
    ).toBe(false);
  });
});
