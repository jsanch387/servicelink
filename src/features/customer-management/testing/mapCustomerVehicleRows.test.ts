import { mapCustomerVehicleRows } from '@/features/customer-management/utils/mapCustomerVehicleRows';
import { describe, expect, it } from 'vitest';

describe('mapCustomerVehicleRows', () => {
  it('labels a vehicle from year, make, and model', () => {
    expect(
      mapCustomerVehicleRows([
        {
          id: 'veh_1',
          label: 'ignored',
          attributes: { year: '2019', make: 'Toyota', model: 'Camry' },
        },
      ])
    ).toEqual([{ id: 'veh_1', label: '2019 Toyota Camry' }]);
  });

  it('uses the stored label when attributes are incomplete', () => {
    expect(
      mapCustomerVehicleRows([
        { id: 'veh_2', label: '  Work truck  ', attributes: { make: 'Ford' } },
        { id: ' ', label: 'Skip', attributes: {} },
      ])
    ).toEqual([{ id: 'veh_2', label: 'Work truck' }]);
  });
});
