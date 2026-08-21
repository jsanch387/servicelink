/**
 * Flexible customer assets (vehicles, pets; boats later).
 * One table + `asset_type` + JSON `attributes` — not one table per industry.
 */

export const CUSTOMER_ASSET_TYPE_VEHICLE = 'vehicle' as const;
export const CUSTOMER_ASSET_TYPE_PET = 'pet' as const;

export type CustomerAssetType =
  | typeof CUSTOMER_ASSET_TYPE_VEHICLE
  | typeof CUSTOMER_ASSET_TYPE_PET
  | string;

export type VehicleAssetAttributes = {
  year: string;
  make: string;
  model: string;
};

export const PET_SPECIES_VALUES = ['Dog', 'Cat'] as const;
export const PET_SIZE_VALUES = [
  'Small',
  'Medium',
  'Large',
  'Extra large',
] as const;

export type PetSpecies = (typeof PET_SPECIES_VALUES)[number];
export type PetSize = (typeof PET_SIZE_VALUES)[number];

export type PetAssetAttributes = {
  name: string;
  species: string;
  breed: string;
  size: string;
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

export function isPetSpeciesValue(value: string): value is PetSpecies {
  return (PET_SPECIES_VALUES as readonly string[]).includes(value);
}

export function isPetSizeValue(value: string): value is PetSize {
  return (PET_SIZE_VALUES as readonly string[]).includes(value);
}

export function petAssetFingerprint(
  name: string,
  species: string,
  breed: string,
  size: string
): string {
  return [
    normalizeAssetToken(name),
    normalizeAssetToken(species),
    normalizeAssetToken(breed),
    normalizeAssetToken(size),
  ].join('|');
}

export function petAssetLabel(
  name: string,
  species: string,
  breed: string,
  size: string
): string {
  const identity = [name.trim(), breed.trim()].filter(Boolean).join(' · ');
  const extras = [species.trim(), size.trim()].filter(Boolean).join(' · ');
  if (identity && extras) return `${identity} · ${extras}`;
  return identity || extras;
}

export function parsePetAssetAttributes(
  attributes: unknown
): PetAssetAttributes | null {
  if (attributes == null || typeof attributes !== 'object') return null;
  const o = attributes as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  const species = typeof o.species === 'string' ? o.species.trim() : '';
  const breed = typeof o.breed === 'string' ? o.breed.trim() : '';
  const size = typeof o.size === 'string' ? o.size.trim() : '';
  if (!name || !species || !breed || !size) return null;
  return { name, species, breed, size };
}

export function buildPetAssetDraft(input: {
  name: string;
  species: string;
  breed: string;
  size: string;
}): {
  assetType: typeof CUSTOMER_ASSET_TYPE_PET;
  label: string;
  fingerprint: string;
  attributes: PetAssetAttributes;
} | null {
  const name = input.name.trim();
  const species = input.species.trim();
  const breed = input.breed.trim();
  const size = input.size.trim();
  if (!name || !species || !breed || !size) return null;
  if (!isPetSpeciesValue(species) || !isPetSizeValue(size)) return null;
  return {
    assetType: CUSTOMER_ASSET_TYPE_PET,
    label: petAssetLabel(name, species, breed, size),
    fingerprint: petAssetFingerprint(name, species, breed, size),
    attributes: { name, species, breed, size },
  };
}
