/**
 * Match an existing CRM customer (phone → email) and pull address + vehicle
 * for membership subscribe / period visit / owner Book visit.
 */

import { listCustomerAssetsByPhone } from '@/features/customer-management/server/listCustomerAssetsByPhone';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import {
  CUSTOMER_ASSET_TYPE_VEHICLE,
  parseVehicleAssetAttributes,
} from '@/features/customer-management/utils/customerAssetTypes';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';

export type MembershipServiceAddress = {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
};

export type MembershipServiceVehicle = {
  year: string;
  make: string;
  model: string;
};

export type MembershipCustomerServiceSnapshot = {
  customerId: string | null;
  address: MembershipServiceAddress;
  vehicle: MembershipServiceVehicle;
  hasUsableAddress: boolean;
  hasVehicle: boolean;
  matchedBy: 'phone' | 'email' | null;
};

const EMPTY_ADDRESS: MembershipServiceAddress = {
  street: '',
  unit: '',
  city: '',
  state: '',
  zip: '',
};

const EMPTY_VEHICLE: MembershipServiceVehicle = {
  year: '',
  make: '',
  model: '',
};

export function emptyMembershipCustomerServiceSnapshot(): MembershipCustomerServiceSnapshot {
  return {
    customerId: null,
    address: { ...EMPTY_ADDRESS },
    vehicle: { ...EMPTY_VEHICLE },
    hasUsableAddress: false,
    hasVehicle: false,
    matchedBy: null,
  };
}

export function isUsableMembershipAddress(
  address: MembershipServiceAddress | null | undefined
): boolean {
  if (!address) return false;
  const street = address.street.trim();
  const city = address.city.trim();
  const state = address.state.trim();
  const zip = address.zip.replace(/\D/g, '');
  return Boolean(street && city && state.length === 2 && zip.length === 5);
}

export function isUsableMembershipVehicle(
  vehicle: MembershipServiceVehicle | null | undefined
): boolean {
  if (!vehicle) return false;
  return Boolean(
    vehicle.year.trim() && vehicle.make.trim() && vehicle.model.trim()
  );
}

/** Prefer non-empty override fields over base. */
export function mergeMembershipServiceSnapshots(
  base: MembershipCustomerServiceSnapshot,
  override: {
    address?: Partial<MembershipServiceAddress> | null;
    vehicle?: Partial<MembershipServiceVehicle> | null;
  } | null
): MembershipCustomerServiceSnapshot {
  const address: MembershipServiceAddress = {
    street: override?.address?.street?.trim() || base.address.street,
    unit: override?.address?.unit?.trim() || base.address.unit,
    city: override?.address?.city?.trim() || base.address.city,
    state: override?.address?.state?.trim() || base.address.state,
    zip: override?.address?.zip?.trim() || base.address.zip,
  };
  const vehicle: MembershipServiceVehicle = {
    year: override?.vehicle?.year?.trim() || base.vehicle.year,
    make: override?.vehicle?.make?.trim() || base.vehicle.make,
    model: override?.vehicle?.model?.trim() || base.vehicle.model,
  };
  return {
    customerId: base.customerId,
    address,
    vehicle,
    hasUsableAddress: isUsableMembershipAddress(address),
    hasVehicle: isUsableMembershipVehicle(vehicle),
    matchedBy: base.matchedBy,
  };
}

async function findCustomerId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  phone: string | null | undefined,
  email: string | null | undefined
): Promise<{ customerId: string; matchedBy: 'phone' | 'email' } | null> {
  const phoneNorm =
    normalizePhoneForLookup(phone) ||
    (phone ? normalizeUsPhoneDigits(phone) : null);
  const emailNorm = email?.trim() ? normalizeEmailForLookup(email) : null;

  if (phoneNorm) {
    const { data } = await db
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone_normalized', phoneNorm)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return { customerId: id, matchedBy: 'phone' };
  }

  if (emailNorm) {
    const { data } = await db
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('email_normalized', emailNorm)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return { customerId: id, matchedBy: 'email' };
  }

  return null;
}

async function loadAddressAndVehicleFromBookings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  customerId: string
): Promise<{
  address: MembershipServiceAddress;
  vehicle: MembershipServiceVehicle;
}> {
  const { data } = await db
    .from('bookings')
    .select(
      'customer_street_address, customer_unit_apt, customer_city, customer_state, customer_zip, customer_vehicle_year, customer_vehicle_make, customer_vehicle_model'
    )
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(15);

  const rows = (data ?? []) as Array<{
    customer_street_address?: string | null;
    customer_unit_apt?: string | null;
    customer_city?: string | null;
    customer_state?: string | null;
    customer_zip?: string | null;
    customer_vehicle_year?: string | null;
    customer_vehicle_make?: string | null;
    customer_vehicle_model?: string | null;
  }>;

  let address = { ...EMPTY_ADDRESS };
  let vehicle = { ...EMPTY_VEHICLE };

  for (const row of rows) {
    const candidate: MembershipServiceAddress = {
      street: String(row.customer_street_address ?? '').trim(),
      unit: String(row.customer_unit_apt ?? '').trim(),
      city: String(row.customer_city ?? '').trim(),
      state: String(row.customer_state ?? '').trim(),
      zip: String(row.customer_zip ?? '').trim(),
    };
    if (
      !isUsableMembershipAddress(address) &&
      isUsableMembershipAddress(candidate)
    ) {
      address = candidate;
    }
    const vCandidate: MembershipServiceVehicle = {
      year: String(row.customer_vehicle_year ?? '').trim(),
      make: String(row.customer_vehicle_make ?? '').trim(),
      model: String(row.customer_vehicle_model ?? '').trim(),
    };
    if (
      !isUsableMembershipVehicle(vehicle) &&
      isUsableMembershipVehicle(vCandidate)
    ) {
      vehicle = vCandidate;
    }
    if (
      isUsableMembershipAddress(address) &&
      isUsableMembershipVehicle(vehicle)
    ) {
      break;
    }
  }

  return { address, vehicle };
}

async function loadVehicleFromAssets(
  supabase: SupabaseClient<Database>,
  businessId: string,
  customerId: string,
  phone: string | null | undefined
): Promise<MembershipServiceVehicle> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: byCustomer } = await db
    .from('customer_assets')
    .select('attributes')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('asset_type', CUSTOMER_ASSET_TYPE_VEHICLE)
    .order('updated_at', { ascending: false })
    .limit(1);

  const fromCustomer = parseVehicleAssetAttributes(
    (byCustomer as Array<{ attributes?: unknown }> | null)?.[0]?.attributes
  );
  if (fromCustomer) {
    return {
      year: fromCustomer.year,
      make: fromCustomer.make,
      model: fromCustomer.model,
    };
  }

  const phoneNorm = phone?.trim();
  if (!phoneNorm) return { ...EMPTY_VEHICLE };

  const assets = await listCustomerAssetsByPhone(supabase, {
    businessId,
    phone: phoneNorm,
    assetType: CUSTOMER_ASSET_TYPE_VEHICLE,
  });
  const fromPhone = parseVehicleAssetAttributes(assets[0]?.attributes);
  if (fromPhone) {
    return {
      year: fromPhone.year,
      make: fromPhone.make,
      model: fromPhone.model,
    };
  }

  return { ...EMPTY_VEHICLE };
}

/**
 * Resolve CRM address + vehicle for a contact at this business.
 */
export async function resolveMembershipCustomerServiceSnapshot(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    phone?: string | null;
    email?: string | null;
    /** When known (membership already linked). */
    customerId?: string | null;
  }
): Promise<MembershipCustomerServiceSnapshot> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const businessId = args.businessId.trim();
  if (!businessId) return emptyMembershipCustomerServiceSnapshot();

  let customerId = args.customerId?.trim() || null;
  let matchedBy: 'phone' | 'email' | null = customerId ? 'phone' : null;

  if (!customerId) {
    const found = await findCustomerId(db, businessId, args.phone, args.email);
    if (found) {
      customerId = found.customerId;
      matchedBy = found.matchedBy;
    }
  }

  if (!customerId) {
    return emptyMembershipCustomerServiceSnapshot();
  }

  const fromBookings = await loadAddressAndVehicleFromBookings(
    db,
    businessId,
    customerId
  );
  let vehicle = fromBookings.vehicle;
  if (!isUsableMembershipVehicle(vehicle)) {
    vehicle = await loadVehicleFromAssets(
      supabase,
      businessId,
      customerId,
      args.phone
    );
  }

  const address = fromBookings.address;
  return {
    customerId,
    address,
    vehicle,
    hasUsableAddress: isUsableMembershipAddress(address),
    hasVehicle: isUsableMembershipVehicle(vehicle),
    matchedBy,
  };
}
