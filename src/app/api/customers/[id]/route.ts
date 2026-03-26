import { resolveCurrentBusinessId } from '@/features/customer-management/server/resolveCurrentBusinessId';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

const CUSTOMER_NOTE_MAX_LENGTH = 280;

export async function PATCH(
  req: Request,
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

    const body = (await req.json().catch(() => null)) as {
      note?: unknown;
    } | null;
    const nextNote = typeof body?.note === 'string' ? body.note.trim() : '';
    if (nextNote.length > CUSTOMER_NOTE_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Notes cannot exceed ${CUSTOMER_NOTE_MAX_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Align with existing customers API query typing pattern.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: updateError } = await (supabase as any)
      .from('customers')
      .update({ notes: nextNote })
      .eq('id', customerId)
      .eq('business_id', businessId)
      .select('id, notes')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message || 'Failed to save customer note',
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note: data.notes ?? '' });
  } catch (e) {
    console.error('PATCH /api/customers/[id]:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

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
