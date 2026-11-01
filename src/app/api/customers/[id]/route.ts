import { createSupabaseServerClient } from '@/libs/supabase/server';
import {
  parseCustomerAddressFields,
  parseCustomerEmailField,
  parseCustomerPhoneField,
  parseCustomerProfileFields,
} from '@/features/customer-management/utils/parseCustomerContactFields';
import { DUPLICATE_CUSTOMER_MESSAGE } from '@/features/customer-management/utils/parseCreateCustomerBody';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { NextResponse } from 'next/server';

const CUSTOMER_NOTE_MAX_LENGTH = 280;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
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

    const businessId = resolved.businessId;
    const { id: customerId } = await params;

    const body = (await req.json().catch(() => null)) as {
      note?: unknown;
      phone?: unknown;
      email?: unknown;
      address?: unknown;
      fullName?: unknown;
    } | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (body && 'fullName' in body) {
      const rawAddress =
        body.address && typeof body.address === 'object'
          ? (body.address as Record<string, unknown>)
          : {};
      const parsed = parseCustomerProfileFields({
        name: typeof body.fullName === 'string' ? body.fullName : '',
        phone: typeof body.phone === 'string' ? body.phone : '',
        email: typeof body.email === 'string' ? body.email : '',
        street: typeof rawAddress.street === 'string' ? rawAddress.street : '',
        unit: typeof rawAddress.unit === 'string' ? rawAddress.unit : '',
        city: typeof rawAddress.city === 'string' ? rawAddress.city : '',
        state: typeof rawAddress.state === 'string' ? rawAddress.state : '',
        zip: typeof rawAddress.zip === 'string' ? rawAddress.zip : '',
        note: typeof body.note === 'string' ? body.note : '',
      });
      if (!parsed.ok) {
        return NextResponse.json(
          { success: false, error: parsed.error },
          { status: 400 }
        );
      }
      if (parsed.profile.phone) {
        const taken = await contactTakenByAnother(
          db,
          businessId,
          customerId,
          'phone_normalized',
          parsed.profile.phone
        );
        if (taken) {
          return NextResponse.json(
            { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
            { status: 409 }
          );
        }
      }
      if (parsed.profile.email) {
        const taken = await contactTakenByAnother(
          db,
          businessId,
          customerId,
          'email_normalized',
          parsed.profile.email
        );
        if (taken) {
          return NextResponse.json(
            { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
            { status: 409 }
          );
        }
      }
      const address = parsed.profile.address;
      return updateCustomerFields(db, businessId, customerId, {
        full_name: parsed.profile.fullName,
        phone: parsed.profile.phone,
        phone_normalized: parsed.profile.phone,
        email: parsed.profile.email,
        email_normalized: parsed.profile.email,
        street_address: address?.street ?? null,
        unit: address?.unit || null,
        city: address?.city ?? null,
        state: address?.state ?? null,
        zip: address?.zip ?? null,
        notes: parsed.profile.note,
      });
    }

    if (body && 'phone' in body) {
      const parsed = parseCustomerPhoneField(
        typeof body.phone === 'string' ? body.phone : ''
      );
      if (!parsed.ok) {
        return NextResponse.json(
          { success: false, error: parsed.error },
          { status: 400 }
        );
      }
      const taken = await contactTakenByAnother(
        db,
        businessId,
        customerId,
        'phone_normalized',
        parsed.phone
      );
      if (taken) {
        return NextResponse.json(
          { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
          { status: 409 }
        );
      }
      return updateCustomerFields(db, businessId, customerId, {
        phone: parsed.phone,
        phone_normalized: parsed.phone,
      });
    }

    if (body && 'email' in body) {
      const parsed = parseCustomerEmailField(
        typeof body.email === 'string' ? body.email : ''
      );
      if (!parsed.ok) {
        return NextResponse.json(
          { success: false, error: parsed.error },
          { status: 400 }
        );
      }
      const taken = await contactTakenByAnother(
        db,
        businessId,
        customerId,
        'email_normalized',
        parsed.email
      );
      if (taken) {
        return NextResponse.json(
          { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
          { status: 409 }
        );
      }
      return updateCustomerFields(db, businessId, customerId, {
        email: parsed.email,
        email_normalized: parsed.email,
      });
    }

    if (body && 'address' in body) {
      const raw =
        body.address && typeof body.address === 'object'
          ? (body.address as Record<string, unknown>)
          : {};
      const parsed = parseCustomerAddressFields({
        street: typeof raw.street === 'string' ? raw.street : '',
        unit: typeof raw.unit === 'string' ? raw.unit : '',
        city: typeof raw.city === 'string' ? raw.city : '',
        state: typeof raw.state === 'string' ? raw.state : '',
        zip: typeof raw.zip === 'string' ? raw.zip : '',
      });
      if (!parsed.ok) {
        return NextResponse.json(
          { success: false, error: parsed.error },
          { status: 400 }
        );
      }
      return updateCustomerFields(db, businessId, customerId, {
        street_address: parsed.address.street,
        unit: parsed.address.unit || null,
        city: parsed.address.city,
        state: parsed.address.state,
        zip: parsed.address.zip,
      });
    }

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

    const { data: deleted, error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('business_id', businessId)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || 'Failed to delete customer',
        },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Couldn't delete this customer." },
        { status: 403 }
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

async function contactTakenByAnother(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  customerId: string,
  column: 'phone_normalized' | 'email_normalized',
  value: string
): Promise<boolean> {
  const { data } = await db
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq(column, value)
    .neq('id', customerId)
    .maybeSingle();
  return Boolean((data as { id?: string } | null)?.id);
}

function updateCustomerFields(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  customerId: string,
  fields: Record<string, string | null>
) {
  return db
    .from('customers')
    .update(fields)
    .eq('id', customerId)
    .eq('business_id', businessId)
    .select(
      'id, full_name, phone, email, street_address, unit, city, state, zip, notes'
    )
    .maybeSingle()
    .then(
      ({
        data,
        error,
      }: {
        data: {
          full_name: string;
          phone: string | null;
          email: string | null;
          street_address: string | null;
          unit: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          notes: string | null;
        } | null;
        error: { message?: string; code?: string } | null;
      }) => {
        if (error) {
          const duplicate = error.code === '23505';
          return NextResponse.json(
            {
              success: false,
              error: duplicate
                ? DUPLICATE_CUSTOMER_MESSAGE
                : error.message || 'Failed to save customer',
            },
            { status: duplicate ? 409 : 500 }
          );
        }
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Customer not found' },
            { status: 404 }
          );
        }
        const street = data.street_address ?? '';
        const city = data.city ?? '';
        const zip = data.zip ?? '';
        return NextResponse.json({
          success: true,
          name: data.full_name,
          phone: data.phone ?? '',
          email: data.email ?? '',
          note: data.notes ?? '',
          address:
            street || city || zip
              ? {
                  street,
                  unit: data.unit ?? '',
                  city,
                  state: data.state ?? '',
                  zip,
                }
              : null,
        });
      }
    );
}
