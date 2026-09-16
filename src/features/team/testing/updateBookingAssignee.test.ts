import { describe, expect, it, vi } from 'vitest';

import { updateBookingAssignee } from '../server/updateBookingAssignee';

function createAdmin(result: {
  data: { id?: string; assigned_user_id?: string | null } | null;
  error: { code?: string; message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eqBusiness = vi.fn().mockReturnValue({ select });
  const eqId = vi.fn().mockReturnValue({ eq: eqBusiness });
  const update = vi.fn().mockReturnValue({ eq: eqId });

  return {
    from: vi.fn(() => ({ update })),
    update,
  };
}

describe('updateBookingAssignee', () => {
  it('saves the worker on that shop booking', async () => {
    const admin = createAdmin({
      data: { id: 'b1', assigned_user_id: 'user-1' },
      error: null,
    });

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'user-1',
      })
    ).resolves.toEqual({ ok: true, assignedUserId: 'user-1' });
  });

  it('returns 404 when the booking is not on this shop', async () => {
    const admin = createAdmin({ data: null, error: null });

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'missing',
        assignedUserId: null,
      })
    ).resolves.toEqual({
      ok: false,
      error: 'Booking not found',
      status: 404,
    });
  });

  it('returns 400 when the trigger rejects the user', async () => {
    const admin = createAdmin({
      data: null,
      error: { code: '23514', message: 'check' },
    });

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'stranger',
      })
    ).resolves.toEqual({
      ok: false,
      error: 'That person is not on this shop.',
      status: 400,
    });
  });
});
