import {
  parseVehicleAssetAttributes,
  vehicleAssetLabel,
} from '@/features/customer-management/utils/customerAssetTypes';

export interface CustomerVehicle {
  id: string;
  label: string;
}

export interface CustomerVehicleRow {
  id: string;
  label: string;
  attributes: unknown;
}

/** Year, make, and model. Falls back to the stored label. */
export function mapCustomerVehicleRows(
  rows: CustomerVehicleRow[]
): CustomerVehicle[] {
  return rows.flatMap(row => {
    const id = row.id.trim();
    if (!id) return [];
    const parsed = parseVehicleAssetAttributes(row.attributes);
    const label = parsed
      ? vehicleAssetLabel(parsed.year, parsed.make, parsed.model)
      : row.label.trim();
    if (!label) return [];
    return [{ id, label }];
  });
}
