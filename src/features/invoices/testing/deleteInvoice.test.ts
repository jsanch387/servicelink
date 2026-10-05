import { describe, expect, it, vi } from 'vitest';

import { deleteInvoice } from '../server/deleteInvoice';

function makeSupabase(opts: {
  deleted?: { id: string }[] | null;
  deleteError?: { message: string } | null;
  notificationError?: { message: string } | null;
}) {
  const calls: string[] = [];
  const from = vi.fn((table: string) => {
    if (table === 'notifications') {
      return {
        delete: vi.fn(() => {
          calls.push('notifications');
          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: opts.notificationError ?? null,
              }),
            }),
          };
        }),
      };
    }

    return {
      delete: vi.fn(() => {
        calls.push('invoices');
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: opts.deleteError
                  ? null
                  : (opts.deleted ?? [{ id: 'inv_1' }]),
                error: opts.deleteError ?? null,
              }),
            }),
          }),
        };
      }),
    };
  });

  return { supabase: { from } as never, calls };
}

describe('deleteInvoice', () => {
  it('deletes the invoice, then its paid notification', async () => {
    const { supabase, calls } = makeSupabase({});

    const result = await deleteInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual(['invoices', 'notifications']);
  });

  it('returns not found when the shop has no such invoice', async () => {
    const { supabase, calls } = makeSupabase({ deleted: [] });

    const result = await deleteInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Invoice not found.',
      status: 404,
    });
    expect(calls).toEqual(['invoices']);
  });

  it('still removes the invoice when the notification delete fails', async () => {
    const { supabase } = makeSupabase({
      notificationError: { message: 'nope' },
    });

    const result = await deleteInvoice(supabase, {
      businessId: 'biz_1',
      invoiceId: 'inv_1',
    });

    expect(result).toEqual({ ok: true });
  });
});
