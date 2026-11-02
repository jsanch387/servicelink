import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notifyOwnerInvoicePaid } from '../server/notifyOwnerInvoicePaid';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn(async () => undefined),
}));

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

function makeSupabase(insertError: { code: string } | null = null) {
  const inserts: Record<string, unknown>[] = [];
  const from = vi.fn((table: string) => {
    if (table === 'notifications') {
      return {
        insert: vi.fn(async (row: Record<string, unknown>) => {
          inserts.push(row);
          return { error: insertError };
        }),
      };
    }

    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                customer_name: 'Alex Rivera',
                total_cents: 20000,
              },
              error: null,
            }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { profile_id: 'user_1' },
            error: null,
          }),
        }),
      }),
    };
  });

  return { supabase: { from } as never, inserts };
}

describe('notifyOwnerInvoicePaid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes one in-app notice and sends one push', async () => {
    const { supabase, inserts } = makeSupabase();

    await notifyOwnerInvoicePaid(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(inserts[0]).toMatchObject({
      user_id: 'user_1',
      type: 'customer_invoice_paid',
      reference_type: 'invoice',
      reference_id: 'inv_1',
      title: 'Invoice paid',
      body: 'Alex Rivera · $200.00',
      dedupe_key: 'customer_invoice_paid:inv_1',
    });
    expect(sendExpoPushToUser).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        userId: 'user_1',
        title: 'Invoice paid',
        body: 'Alex Rivera · $200.00',
        data: { reference_type: 'invoice', reference_id: 'inv_1' },
      })
    );
  });

  it('does not push again when the notice already exists', async () => {
    const { supabase } = makeSupabase({ code: '23505' });

    await notifyOwnerInvoicePaid(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });
});
