import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { upsertCustomerAssets } from '@/features/customer-management/server/upsertCustomerAssets';
import {
  sanitizeCustomerImportRecord,
  selectCustomersToImport,
  type CustomerImportExisting,
  type CustomerImportRecord,
} from '@/features/customer-management/utils/buildCustomerImportPreview';
import { buildVehicleAssetDraft } from '@/features/customer-management/utils/customerAssetTypes';
import { CUSTOMER_IMPORT_MAX_ROWS } from '@/features/customer-management/utils/customerImportFields';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CustomerImportResult = {
  created: number;
  skipped: number;
  failed: number;
};

export async function importCustomersForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  body: unknown
): Promise<
  { ok: true; result: CustomerImportResult } | { ok: false; error: string }
> {
  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { customers?: unknown }).customers)
  ) {
    return { ok: false, error: 'Invalid request body' };
  }
  const customers = (body as { customers: unknown[] }).customers;
  if (customers.length > CUSTOMER_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      error: `Import up to ${CUSTOMER_IMPORT_MAX_ROWS.toLocaleString()} customers at a time.`,
    };
  }

  const records: CustomerImportRecord[] = [];
  let failed = 0;
  for (const customer of customers) {
    const parsed = sanitizeCustomerImportRecord(customer);
    if (!parsed.ok) {
      failed += 1;
      continue;
    }
    records.push(parsed.record);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile, error: profileError } = await db
    .from('business_profiles')
    .select('business_type')
    .eq('id', businessId)
    .maybeSingle();
  if (profileError) {
    console.error('customer import profile:', profileError);
    return { ok: false, error: "Couldn't import these customers." };
  }
  const includeVehicles = isVehicleRelatedBusinessType(
    (profile as { business_type?: string | null } | null)?.business_type
  );

  const { data: existingRows, error: existingError } = await db
    .from('customers')
    .select('phone_normalized, email_normalized')
    .eq('business_id', businessId);
  if (existingError) {
    console.error('customer import existing:', existingError);
    return { ok: false, error: "Couldn't import these customers." };
  }

  const existing: CustomerImportExisting[] = (
    (existingRows ?? []) as {
      phone_normalized: string | null;
      email_normalized: string | null;
    }[]
  ).map(row => ({
    phone: row.phone_normalized ?? '',
    email: row.email_normalized ?? '',
  }));

  const { create, skipped } = selectCustomersToImport(records, existing);
  let created = 0;
  let skippedCount = skipped;

  for (let index = 0; index < create.length; index += 8) {
    const slice = create.slice(index, index + 8);
    const outcomes = await Promise.all(
      slice.map(record =>
        insertImportedCustomer(supabase, businessId, record, includeVehicles)
      )
    );
    for (const outcome of outcomes) {
      if (outcome === 'created') created += 1;
      else if (outcome === 'skipped') skippedCount += 1;
      else failed += 1;
    }
  }

  return { ok: true, result: { created, skipped: skippedCount, failed } };
}

async function insertImportedCustomer(
  supabase: SupabaseClient<Database>,
  businessId: string,
  record: CustomerImportRecord,
  includeVehicles: boolean
): Promise<'created' | 'skipped' | 'failed'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('customers')
    .insert({
      business_id: businessId,
      full_name: record.fullName,
      phone: record.phone,
      email: record.email,
      phone_normalized: record.phone,
      email_normalized: record.email,
      notes: record.notes,
      street_address: record.address?.street ?? null,
      unit: record.address?.unit || null,
      city: record.address?.city ?? null,
      state: record.address?.state ?? null,
      zip: record.address?.zip ?? null,
      maintenance_visits_completed: 0,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return 'skipped';
    console.error('customer import insert:', error);
    return 'failed';
  }
  const customerId = (data as { id?: string } | null)?.id;
  if (!customerId) return 'failed';

  if (includeVehicles && record.vehicles.length > 0) {
    const assets = record.vehicles.flatMap(vehicle => {
      const draft = buildVehicleAssetDraft(vehicle);
      return draft ? [draft] : [];
    });
    try {
      await upsertCustomerAssets(supabase, {
        businessId,
        customerId,
        assets,
      });
    } catch (vehicleError) {
      console.error('customer import vehicles:', vehicleError);
    }
  }

  return 'created';
}
