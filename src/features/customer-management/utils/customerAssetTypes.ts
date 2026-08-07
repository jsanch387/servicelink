/**
 * Flexible customer assets (vehicles today; pets/boats later).
 * One table + `asset_type` + JSON `attributes` — not one table per industry.
 */

export const CUSTOMER_ASSET_TYPE_VEHICLE = 'vehicle' as const;

export type CustomerAssetType = typeof CUSTOMER_ASSET_TYPE_VEHICLE | string;

export type VehicleAssetAttributes = {
  year: string;
  make: string;
  model: string;
};

export type CustomerAssetRecord = {
  id: string;
  assetType: string;
  label: string;
  attributes: Record<string, unknown>;
};

/** Normalize for fingerprint / dedupe. */
export function normalizeAssetToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function vehicleAssetFingerprint(
  year: string,
  make: string,
  model: string
): string {
  return [
    normalizeAssetToken(year),
    normalizeAssetToken(make),
    normalizeAssetToken(model),
  ].join('|');
}

export function vehicleAssetLabel(
  year: string,
  make: string,
  model: string
): string {
  return [year.trim(), make.trim(), model.trim()].filter(Boolean).join(' ');
}

export function parseVehicleAssetAttributes(
  attributes: unknown
): VehicleAssetAttributes | null {
  if (attributes == null || typeof attributes !== 'object') return null;
  const o = attributes as Record<string, unknown>;
  const year = typeof o.year === 'string' ? o.year.trim() : '';
  const make = typeof o.make === 'string' ? o.make.trim() : '';
  const model = typeof o.model === 'string' ? o.model.trim() : '';
  if (!year || !make || !model) return null;
  return { year, make, model };
}

export function buildVehicleAssetDraft(input: {
  year: string;
  make: string;
  model: string;
}): {
  assetType: typeof CUSTOMER_ASSET_TYPE_VEHICLE;
  label: string;
  fingerprint: string;
  attributes: VehicleAssetAttributes;
} | null {
  const year = input.year.trim();
  const make = input.make.trim();
  const model = input.model.trim();
  if (!year || !make || !model) return null;
  return {
    assetType: CUSTOMER_ASSET_TYPE_VEHICLE,
    label: vehicleAssetLabel(year, make, model),
    fingerprint: vehicleAssetFingerprint(year, make, model),
    attributes: { year, make, model },
  };
}
