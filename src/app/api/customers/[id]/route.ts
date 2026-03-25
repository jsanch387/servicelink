import { resolveCurrentBusinessId } from '@/features/customer-management/server/resolveCurrentBusinessId';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessId = resolved.businessId;
    const { id: customerId } = await params;

    // Ensure this customer belongs to the current business.
    const { data: existing, error: existingError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error: existingError.message || 'Failed to validate customer',
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('business_id', businessId);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || 'Failed to delete customer',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/customers/[id]:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
