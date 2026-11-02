import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { upsertCustomerAssets } from '@/features/customer-management/server/upsertCustomerAssets';
import {
  CUSTOMER_ASSET_TYPE_VEHICLE,
  buildVehicleAssetDraft,
  parseManualVehicleFields,
} from '@/features/customer-management/utils/customerAssetTypes';
import { mapCustomerVehicleRows } from '@/features/customer-management/utils/mapCustomerVehicleRows';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

const MAX_VEHICLES = 20;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    const { supabase } = auth;
    const resolved = await requireBusinessPermission(
      supabase,
      'customers.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { id } = await params;
    const customerId = id.trim();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile, error: profileError } = await db
      .from('business_profiles')
      .select('business_type')
      .eq('id', resolved.businessId)
      .maybeSingle();

    if (profileError) {
      console.error('customer vehicles profile error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to load vehicles' },
        { status: 500 }
      );
    }

    const businessType = (profile as { business_type?: string | null } | null)
      ?.business_type;
    if (!isVehicleRelatedBusinessType(businessType)) {
      return NextResponse.json({ success: true, vehicles: [] });
    }

    const { data: rows, error } = await db
      .from('customer_assets')
      .select('id, label, attributes')
      .eq('business_id', resolved.businessId)
      .eq('customer_id', customerId)
      .eq('asset_type', CUSTOMER_ASSET_TYPE_VEHICLE)
      .order('updated_at', { ascending: false })
      .limit(MAX_VEHICLES);

    if (error) {
      console.error('customer vehicles error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load vehicles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicles: mapCustomerVehicleRows(rows ?? []),
    });
  } catch (error) {
    console.error('GET /api/customers/[id]/vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    const { supabase } = auth;
    const resolved = await requireBusinessPermission(
      supabase,
      'customers.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { id } = await params;
    const customerId = id.trim();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      year?: unknown;
      make?: unknown;
      model?: unknown;
    } | null;
    const parsed = parseManualVehicleFields({
      year: typeof body?.year === 'string' ? body.year : '',
      make: typeof body?.make === 'string' ? body.make : '',
      model: typeof body?.model === 'string' ? body.model : '',
    });
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const draft = buildVehicleAssetDraft(parsed);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Year, make, and model are required.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile, error: profileError } = await db
      .from('business_profiles')
      .select('business_type')
      .eq('id', resolved.businessId)
      .maybeSingle();

    if (profileError) {
      console.error('customer vehicle create profile error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to save vehicle' },
        { status: 500 }
      );
    }

    const businessType = (profile as { business_type?: string | null } | null)
      ?.business_type;
    if (!isVehicleRelatedBusinessType(businessType)) {
      return NextResponse.json(
        { success: false, error: 'This business does not save vehicles.' },
        { status: 400 }
      );
    }

    const { data: customer, error: customerError } = await db
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('business_id', resolved.businessId)
      .maybeSingle();

    if (customerError) {
      console.error('customer vehicle create lookup error:', customerError);
      return NextResponse.json(
        { success: false, error: 'Failed to save vehicle' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    await upsertCustomerAssets(supabase, {
      businessId: resolved.businessId,
      customerId,
      assets: [draft],
    });

    const { data: saved, error: savedError } = await db
      .from('customer_assets')
      .select('id, label, attributes')
      .eq('business_id', resolved.businessId)
      .eq('customer_id', customerId)
      .eq('asset_type', CUSTOMER_ASSET_TYPE_VEHICLE)
      .eq('fingerprint', draft.fingerprint)
      .maybeSingle();

    if (savedError || !saved) {
      console.error('customer vehicle create read error:', savedError);
      return NextResponse.json(
        { success: false, error: 'Failed to save vehicle' },
        { status: 500 }
      );
    }

    const vehicle = mapCustomerVehicleRows([saved])[0];
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Failed to save vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error('POST /api/customers/[id]/vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
