/**
 * GET /api/public/customer-assets?businessSlug=&phone=
 *
 * Returns saved assets (vehicles today) for a returning customer identified by
 * phone within a business. No contact PII is returned — only asset labels and
 * attributes needed to one-tap fill the booking form.
 */

import { listCustomerAssetsByPhone } from '@/features/customer-management/server/listCustomerAssetsByPhone';
import { CUSTOMER_ASSET_TYPE_VEHICLE } from '@/features/customer-management/utils/customerAssetTypes';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const businessSlug = request.nextUrl.searchParams.get('businessSlug')?.trim();
  const phone = request.nextUrl.searchParams.get('phone')?.trim() ?? '';
  const assetType =
    request.nextUrl.searchParams.get('assetType')?.trim() ||
    CUSTOMER_ASSET_TYPE_VEHICLE;

  if (!businessSlug) {
    return NextResponse.json(
      { success: false, error: 'businessSlug is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const supabase = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('business_profiles')
    .select('id')
    .eq('business_slug', businessSlug)
    .maybeSingle();

  const businessId = (profile as { id?: string } | null)?.id;
  if (profileError || !businessId) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const assets = await listCustomerAssetsByPhone(supabase, {
      businessId,
      phone,
      assetType,
    });

    return NextResponse.json(
      {
        success: true,
        assets: assets.map(a => ({
          id: a.id,
          assetType: a.assetType,
          label: a.label,
          attributes: a.attributes,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[public/customer-assets]', err);
    return NextResponse.json(
      { success: false, error: 'Unable to load saved items' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
