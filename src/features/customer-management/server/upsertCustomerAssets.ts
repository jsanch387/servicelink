/**
 * Upsert customer assets (vehicles, later pets/boats) after a booking is created.
 * Dedupes by (customer_id, asset_type, fingerprint). Server / admin client only.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildPetAssetDraft,
  buildVehicleAssetDraft,
  type PetAssetAttributes,
  type VehicleAssetAttributes,
} from '../utils/customerAssetTypes';

export type CustomerAssetUpsertInput = {
  assetType: string;
  label: string;
  fingerprint: string;
  attributes: Record<string, unknown>;
};

/**
 * Collect unique vehicle drafts from booking customer fields and/or job vehicles.
 */
export function collectVehicleAssetsFromBooking(args: {
  customerVehicle?: {
    year?: string | null;
    make?: string | null;
    model?: string | null;
  } | null;
  jobVehicles?: Array<{
    year?: string | null;
    make?: string | null;
    model?: string | null;
  } | null>;
}): CustomerAssetUpsertInput[] {
  const drafts: CustomerAssetUpsertInput[] = [];
  const seen = new Set<string>();

  const push = (
    year?: string | null,
    make?: string | null,
    model?: string | null
  ) => {
    const draft = buildVehicleAssetDraft({
      year: year ?? '',
      make: make ?? '',
      model: model ?? '',
    });
    if (!draft || seen.has(draft.fingerprint)) return;
    seen.add(draft.fingerprint);
    drafts.push(draft);
  };

  if (args.customerVehicle) {
    push(
      args.customerVehicle.year,
      args.customerVehicle.make,
      args.customerVehicle.model
    );
  }
  for (const v of args.jobVehicles ?? []) {
    if (!v) continue;
    push(v.year, v.make, v.model);
  }

  return drafts;
}

/**
 * Collect unique pet drafts from booking customer fields and/or job pets.
 */
export function collectPetAssetsFromBooking(args: {
  customerPet?: {
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    size?: string | null;
  } | null;
  jobPets?: Array<{
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    size?: string | null;
  } | null>;
}): CustomerAssetUpsertInput[] {
  const drafts: CustomerAssetUpsertInput[] = [];
  const seen = new Set<string>();

  const push = (
    name?: string | null,
    species?: string | null,
    breed?: string | null,
    size?: string | null
  ) => {
    const draft = buildPetAssetDraft({
      name: name ?? '',
      species: species ?? '',
      breed: breed ?? '',
      size: size ?? '',
    });
    if (!draft || seen.has(draft.fingerprint)) return;
    seen.add(draft.fingerprint);
    drafts.push(draft);
  };

  if (args.customerPet) {
    push(
      args.customerPet.name,
      args.customerPet.species,
      args.customerPet.breed,
      args.customerPet.size
    );
  }
  for (const pet of args.jobPets ?? []) {
    if (!pet) continue;
    push(pet.name, pet.species, pet.breed, pet.size);
  }

  return drafts;
}

export async function upsertCustomerAssets(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    customerId: string;
    assets: CustomerAssetUpsertInput[];
  }
): Promise<void> {
  if (args.assets.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const now = new Date().toISOString();
  const rows = args.assets.map(asset => ({
    business_id: args.businessId,
    customer_id: args.customerId,
    asset_type: asset.assetType,
    label: asset.label,
    fingerprint: asset.fingerprint,
    attributes: asset.attributes,
    updated_at: now,
  }));

  const { error } = await db.from('customer_assets').upsert(rows, {
    onConflict: 'customer_id,asset_type,fingerprint',
  });

  if (error) {
    throw error;
  }
}

/** Convenience: persist vehicles from a just-created booking. */
export async function upsertCustomerVehiclesFromBooking(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    customerId: string;
    customerVehicle?: {
      year?: string | null;
      make?: string | null;
      model?: string | null;
    } | null;
    jobVehicles?: Array<{
      year?: string | null;
      make?: string | null;
      model?: string | null;
    } | null>;
  }
): Promise<VehicleAssetAttributes[]> {
  const assets = collectVehicleAssetsFromBooking(args);
  await upsertCustomerAssets(supabase, {
    businessId: args.businessId,
    customerId: args.customerId,
    assets,
  });
  return assets.map(a => a.attributes as VehicleAssetAttributes);
}

/** Convenience: persist pets from a just-created booking. */
export async function upsertCustomerPetsFromBooking(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    customerId: string;
    customerPet?: {
      name?: string | null;
      species?: string | null;
      breed?: string | null;
      size?: string | null;
    } | null;
    jobPets?: Array<{
      name?: string | null;
      species?: string | null;
      breed?: string | null;
      size?: string | null;
    } | null>;
  }
): Promise<PetAssetAttributes[]> {
  const assets = collectPetAssetsFromBooking(args);
  await upsertCustomerAssets(supabase, {
    businessId: args.businessId,
    customerId: args.customerId,
    assets,
  });
  return assets.map(a => a.attributes as PetAssetAttributes);
}
