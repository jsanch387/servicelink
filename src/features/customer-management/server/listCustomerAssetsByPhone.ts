/**
 * Public booking helper: find a customer by phone within a business and return
 * their saved assets (vehicles today). Returns assets only — no contact PII.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePhoneForLookup } from './normalizeCustomerContact';
import {
  CUSTOMER_ASSET_TYPE_VEHICLE,
  type CustomerAssetRecord,
} from '../utils/customerAssetTypes';

const MAX_ASSETS = 20;

export async function listCustomerAssetsByPhone(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    phone: string;
    assetType?: string;
  }
): Promise<CustomerAssetRecord[]> {
  const phoneNormalized = normalizePhoneForLookup(args.phone);
  if (!phoneNormalized || phoneNormalized.length < 10) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: customer } = await db
    .from('customers')
    .select('id')
    .eq('business_id', args.businessId)
    .eq('phone_normalized', phoneNormalized)
    .maybeSingle();

  const customerId = (customer as { id?: string } | null)?.id;
  if (!customerId) return [];

  let query = db
    .from('customer_assets')
    .select('id, asset_type, label, attributes')
    .eq('business_id', args.businessId)
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .limit(MAX_ASSETS);

  const assetType = args.assetType?.trim() || CUSTOMER_ASSET_TYPE_VEHICLE;
  if (assetType) {
    query = query.eq('asset_type', assetType);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    asset_type: string;
    label: string;
    attributes: unknown;
  }>;

  return rows.map(row => ({
    id: row.id,
    assetType: row.asset_type,
    label: row.label,
    attributes:
      row.attributes != null && typeof row.attributes === 'object'
        ? (row.attributes as Record<string, unknown>)
        : {},
  }));
}
