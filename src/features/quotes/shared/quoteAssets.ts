/**
 * Snapshot of what the quote is about — same idea as `customer_assets`.
 * Detailers store vehicles, groomers store pets, cleaners usually store none
 * (the property is the address).
 */

import {
  CUSTOMER_ASSET_TYPE_PET,
  CUSTOMER_ASSET_TYPE_VEHICLE,
  parsePetAssetAttributes,
  parseVehicleAssetAttributes,
  petAssetLabel,
  vehicleAssetLabel,
} from '@/features/customer-management/utils/customerAssetTypes';

export type QuoteAsset = {
  type: string;
  label: string;
  attributes: Record<string, unknown>;
};

export function formatQuoteVehicleLine(
  year: string | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined
): string | null {
  const label = vehicleAssetLabel(year ?? '', make ?? '', model ?? '');
  return label || null;
}

export function formatQuoteAssetLine(
  asset: QuoteAsset | null | undefined
): string | null {
  const label = asset?.label?.trim() || '';
  if (label) return label;
  if (!asset) return null;
  if (asset.type === CUSTOMER_ASSET_TYPE_VEHICLE) {
    const vehicle = parseVehicleAssetAttributes(asset.attributes);
    return vehicle
      ? vehicleAssetLabel(vehicle.year, vehicle.make, vehicle.model)
      : formatQuoteVehicleLine(
          stringAttr(asset.attributes, 'year'),
          stringAttr(asset.attributes, 'make'),
          stringAttr(asset.attributes, 'model')
        );
  }
  if (asset.type === CUSTOMER_ASSET_TYPE_PET) {
    const pet = parsePetAssetAttributes(asset.attributes);
    return pet
      ? petAssetLabel(pet.name, pet.species, pet.breed, pet.size)
      : null;
  }
  return null;
}

export function quoteAssetFromVehicleParts(
  year: string | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined
): QuoteAsset | null {
  const y = year?.trim() || '';
  const mk = make?.trim() || '';
  const md = model?.trim() || '';
  if (!y && !mk && !md) return null;
  return {
    type: CUSTOMER_ASSET_TYPE_VEHICLE,
    label: vehicleAssetLabel(y, mk, md),
    attributes: {
      year: y || null,
      make: mk || null,
      model: md || null,
    },
  };
}

export function quoteAssetFromDisplayLine(
  line: string | null | undefined
): QuoteAsset | null {
  const text = line?.trim() ?? '';
  if (!text) return null;
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 3 && /^(19|20)\d{2}$/.test(parts[0] ?? '')) {
    return quoteAssetFromVehicleParts(
      parts[0],
      parts[1],
      parts.slice(2).join(' ')
    );
  }
  return {
    type: CUSTOMER_ASSET_TYPE_VEHICLE,
    label: text,
    attributes: { year: null, make: null, model: text },
  };
}

export function buildQuoteAssets(
  ...parts: Array<
    | {
        year?: string | null;
        make?: string | null;
        model?: string | null;
      }
    | null
    | undefined
  >
): QuoteAsset[] | null {
  const assets = parts
    .map(part =>
      part ? quoteAssetFromVehicleParts(part.year, part.make, part.model) : null
    )
    .filter((asset): asset is QuoteAsset => asset != null);
  return assets.length > 0 ? assets : null;
}

export function normalizeQuoteAssets(raw: unknown): QuoteAsset[] | null {
  if (raw == null || !Array.isArray(raw) || raw.length === 0) return null;
  const out: QuoteAsset[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const typed = quoteAssetFromStored(row);
    if (typed) out.push(typed);
  }
  return out.length > 0 ? out : null;
}

/**
 * Replace vehicle assets from the owner form. Keeps non-vehicle extras (pets).
 */
export function replaceQuoteVehicleAssets(
  existing: readonly QuoteAsset[] | null | undefined,
  primaryVehicle: {
    year?: string | null;
    make?: string | null;
    model?: string | null;
  },
  secondVehicle?: {
    year?: string | null;
    make?: string | null;
    model?: string | null;
  } | null
): QuoteAsset[] | null {
  const vehicles = [
    quoteAssetFromVehicleParts(
      primaryVehicle.year,
      primaryVehicle.make,
      primaryVehicle.model
    ),
    secondVehicle
      ? quoteAssetFromVehicleParts(
          secondVehicle.year,
          secondVehicle.make,
          secondVehicle.model
        )
      : null,
  ].filter((asset): asset is QuoteAsset => asset != null);
  const extras = (existing ?? []).filter(
    asset => asset.type !== CUSTOMER_ASSET_TYPE_VEHICLE
  );
  const out = [...vehicles, ...extras];
  return out.length > 0 ? out : null;
}

export function takeFirstExtraVehicle(extras: readonly QuoteAsset[]): {
  vehicle: { year: string; make: string; model: string } | null;
  remaining: QuoteAsset[];
} {
  const index = extras.findIndex(
    asset => asset.type === CUSTOMER_ASSET_TYPE_VEHICLE
  );
  if (index < 0) return { vehicle: null, remaining: [...extras] };
  const asset = extras[index];
  if (!asset) return { vehicle: null, remaining: [...extras] };
  const fields = {
    year: stringAttr(asset.attributes, 'year')?.trim() ?? '',
    make: stringAttr(asset.attributes, 'make')?.trim() ?? '',
    model: stringAttr(asset.attributes, 'model')?.trim() ?? '',
  };
  if (!fields.year && !fields.make && !fields.model) {
    const fromLine = quoteAssetFromDisplayLine(asset.label);
    if (fromLine) {
      fields.year = stringAttr(fromLine.attributes, 'year')?.trim() ?? '';
      fields.make = stringAttr(fromLine.attributes, 'make')?.trim() ?? '';
      fields.model = stringAttr(fromLine.attributes, 'model')?.trim() ?? '';
    }
  }
  if (!fields.year && !fields.make && !fields.model && asset.label.trim()) {
    fields.model = asset.label.trim();
  }
  return {
    vehicle: fields,
    remaining: extras.filter((_, i) => i !== index),
  };
}

/** Owner form only edits the first vehicle. Keep extra cars/pets as-is. */
export function mergeQuoteAssetsPreservingExtra(
  existing: readonly QuoteAsset[] | null | undefined,
  primaryVehicle: {
    year?: string | null;
    make?: string | null;
    model?: string | null;
  }
): QuoteAsset[] | null {
  const nextPrimary = quoteAssetFromVehicleParts(
    primaryVehicle.year,
    primaryVehicle.make,
    primaryVehicle.model
  );
  const extra = (existing ?? []).slice(1);
  if (!nextPrimary && extra.length === 0) return null;
  return nextPrimary ? [nextPrimary, ...extra] : extra;
}

export function quoteAssetsSectionHeading(
  assets: readonly QuoteAsset[] | null | undefined
): string {
  const types = [
    ...new Set((assets ?? []).map(asset => asset.type).filter(Boolean)),
  ];
  if (types.length === 1 && types[0] === CUSTOMER_ASSET_TYPE_PET) {
    return (assets?.length ?? 0) > 1 ? 'Pets' : 'Pet';
  }
  if (types.length === 1 && types[0] === CUSTOMER_ASSET_TYPE_VEHICLE) {
    return (assets?.length ?? 0) > 1 ? 'Vehicles' : 'Vehicle';
  }
  if (types.length > 1) return 'Details';
  return 'Vehicle';
}

export function primaryVehicleFieldsFromQuote(input: {
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  assets?: readonly QuoteAsset[] | null;
}): { year: string; make: string; model: string } {
  const year = input.vehicleYear?.trim() ?? '';
  const make = input.vehicleMake?.trim() ?? '';
  const model = input.vehicleModel?.trim() ?? '';
  if (year || make || model) return { year, make, model };
  const first = input.assets?.[0];
  if (!first) return { year: '', make: '', model: '' };
  return {
    year: stringAttr(first.attributes, 'year')?.trim() ?? '',
    make: stringAttr(first.attributes, 'make')?.trim() ?? '',
    model: stringAttr(first.attributes, 'model')?.trim() ?? '',
  };
}

export function extraQuoteAssetsFromQuote(
  assets: readonly QuoteAsset[] | null | undefined,
  fallbackLine?: string | null
): QuoteAsset[] {
  const extra = (assets ?? []).slice(1);
  if (extra.length > 0) return extra;
  const fromNote = quoteAssetFromDisplayLine(fallbackLine);
  return fromNote ? [fromNote] : [];
}

export function formatQuoteAssetsCardLine(
  assets: readonly QuoteAsset[] | null | undefined,
  fallbackLine?: string | null
): { line: string; extraCount: number } | null {
  const labels = (assets ?? [])
    .map(asset => formatQuoteAssetLine(asset))
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) {
    const fallback = fallbackLine?.trim() || '';
    return fallback ? { line: fallback, extraCount: 0 } : null;
  }
  return { line: labels[0] ?? '', extraCount: Math.max(0, labels.length - 1) };
}

/** Inbox line: `2018 Toyota Tacoma +1` when there is more than one asset. */
export function formatQuoteAssetsCardDisplay(
  assets: readonly QuoteAsset[] | null | undefined,
  fallbackLine?: string | null
): string | null {
  const parsed = formatQuoteAssetsCardLine(assets, fallbackLine);
  if (!parsed) return null;
  return parsed.extraCount > 0
    ? `${parsed.line} +${parsed.extraCount}`
    : parsed.line;
}

export function extraQuoteAssetHeading(
  asset: QuoteAsset,
  extraIndex: number
): string {
  if (asset.type === CUSTOMER_ASSET_TYPE_PET) {
    return extraIndex === 0 ? 'Second pet' : `Pet ${extraIndex + 2}`;
  }
  if (asset.type === CUSTOMER_ASSET_TYPE_VEHICLE) {
    return extraIndex === 0 ? 'Second vehicle' : `Vehicle ${extraIndex + 2}`;
  }
  return extraIndex === 0 ? 'Also' : `Item ${extraIndex + 2}`;
}

function stringAttr(
  attributes: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = attributes?.[key];
  return typeof value === 'string' ? value : null;
}

function quoteAssetFromStored(row: Record<string, unknown>): QuoteAsset | null {
  const type =
    typeof row.type === 'string' && row.type.trim()
      ? row.type.trim()
      : typeof row.assetType === 'string' && row.assetType.trim()
        ? row.assetType.trim()
        : null;
  const attributes =
    row.attributes && typeof row.attributes === 'object'
      ? (row.attributes as Record<string, unknown>)
      : row;

  if (
    type === CUSTOMER_ASSET_TYPE_PET ||
    attributes.name ||
    attributes.species
  ) {
    const pet = parsePetAssetAttributes(attributes);
    if (pet) {
      return {
        type: CUSTOMER_ASSET_TYPE_PET,
        label:
          (typeof row.label === 'string' && row.label.trim()) ||
          petAssetLabel(pet.name, pet.species, pet.breed, pet.size),
        attributes: pet,
      };
    }
  }

  const vehicle =
    parseVehicleAssetAttributes(attributes) ??
    quoteVehicleAttrsFromLoose(attributes);
  if (vehicle) {
    return {
      type: CUSTOMER_ASSET_TYPE_VEHICLE,
      label:
        (typeof row.label === 'string' && row.label.trim()) ||
        vehicleAssetLabel(vehicle.year, vehicle.make, vehicle.model),
      attributes: {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
      },
    };
  }

  const loose = quoteAssetFromVehicleParts(
    stringAttr(attributes, 'year'),
    stringAttr(attributes, 'make'),
    stringAttr(attributes, 'model')
  );
  if (loose) {
    return {
      ...loose,
      type: type || loose.type,
      label: (typeof row.label === 'string' && row.label.trim()) || loose.label,
    };
  }

  const label = typeof row.label === 'string' ? row.label.trim() : '';
  if (type && label) {
    return {
      type,
      label,
      attributes: attributes && attributes !== row ? attributes : {},
    };
  }
  return null;
}

function quoteVehicleAttrsFromLoose(attributes: Record<string, unknown>): {
  year: string;
  make: string;
  model: string;
} | null {
  const year = stringAttr(attributes, 'year')?.trim() || '';
  const make = stringAttr(attributes, 'make')?.trim() || '';
  const model = stringAttr(attributes, 'model')?.trim() || '';
  if (!year && !make && !model) return null;
  if (!year || !make || !model) return null;
  return { year, make, model };
}
