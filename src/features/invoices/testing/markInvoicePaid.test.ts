import { describe, expect, it, vi } from 'vitest';

import { markInvoicePaid } from '../server/markInvoicePaid';

vi.mock('../server/notifyOwnerInvoicePaid', () => ({
  notifyOwnerInvoicePaid: vi.fn(async () => undefined),
}));

function makeSupabase(opts: {
  row?: { id: string; status: string } | null;
  updateError?: { message: string } | null;
}) {
  const updates: Record<string, unknown>[] = [];
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: opts.row === undefined ? null : opts.row,
            error: null,
          }),
        }),
      }),
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
          }),
        }),
      };
    }),
  }));

  return { supabase: { from } as never, updates };
}

describe('markInvoicePaid', () => {
  it('marks a sent invoice paid', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'sent' },
    });

    const result = await markInvoicePaid(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
      method: 'cash',
    });

    expect(result).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({
      status: 'paid',
      payment_method: 'cash',
    });
  });

  it('leaves a void invoice unchanged', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'void' },
    });

    const result = await markInvoicePaid(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
      method: 'other',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Only a sent invoice can be marked paid.',
      status: 409,
    });
    expect(updates).toHaveLength(0);
  });

  it('treats an already paid invoice as done', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'paid' },
    });

    const result = await markInvoicePaid(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
      method: 'payment_app',
    });

    expect(result).toEqual({ ok: true });
    expect(updates).toHaveLength(0);
  });
});
