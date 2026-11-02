import { describe, expect, it, vi } from 'vitest';

import { voidInvoice } from '../server/voidInvoice';

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

describe('voidInvoice', () => {
  it('voids a sent invoice', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'sent' },
    });

    const result = await voidInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({ ok: true });
    expect(updates[0]).toEqual({ status: 'void' });
  });

  it('leaves a paid invoice unchanged', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'paid' },
    });

    const result = await voidInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Only a sent invoice can be voided.',
      status: 409,
    });
    expect(updates).toHaveLength(0);
  });

  it('treats an already void invoice as done', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'void' },
    });

    const result = await voidInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({ ok: true });
    expect(updates).toHaveLength(0);
  });
});
