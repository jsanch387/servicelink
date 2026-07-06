import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveBusinessProfileUrl } from './buildInvoiceSnapshot';

export interface BusinessProfileForInvoice {
  id: string;
  name: string;
  businessSlug: string | null;
  businessLink: string | null;
  profileUrl: string | null;
}

export async function loadBusinessProfileForInvoice(
  admin: SupabaseClient,
  businessId: string
): Promise<BusinessProfileForInvoice> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('business_profiles')
    .select('id, business_name, business_slug, business_link')
    .eq('id', businessId)
    .maybeSingle();

  if (error) {
    console.error('[invoice] loadBusinessProfileForInvoice', {
      businessId,
      error,
    });
  }

  const row = data as {
    id?: string;
    business_name?: string | null;
    business_slug?: string | null;
    business_link?: string | null;
  } | null;

  const businessSlug = row?.business_slug?.trim() || null;
  const businessLink = row?.business_link?.trim() || null;

  return {
    id: row?.id?.trim() || businessId,
    name: row?.business_name?.trim() || 'Your provider',
    businessSlug,
    businessLink,
    profileUrl: resolveBusinessProfileUrl({ businessLink, businessSlug }),
  };
}
