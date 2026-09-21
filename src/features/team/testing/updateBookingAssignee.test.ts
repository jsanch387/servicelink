import { describe, expect, it, vi } from 'vitest';

import { updateBookingAssignee } from '../server/updateBookingAssignee';

function createAdmin(options: {
  existing?: {
    id: string;
    status: string;
    assigned_user_id?: string | null;
  } | null;
  loadError?: { message: string } | null;
  update?: {
    data: { id?: string; assigned_user_id?: string | null } | null;
    error: { code?: string; message: string } | null;
  };
}) {
  const selectMaybeSingle = vi.fn().mockResolvedValue({
    data:
      options.existing === undefined
        ? { id: 'b1', status: 'confirmed' }
        : options.existing,
    error: options.loadError ?? null,
  });
  const selectEqBusiness = vi.fn().mockReturnValue({
    maybeSingle: selectMaybeSingle,
  });
  const selectEqId = vi.fn().mockReturnValue({ eq: selectEqBusiness });

  const updateMaybeSingle = vi.fn().mockResolvedValue(
    options.update ?? {
      data: { id: 'b1', assigned_user_id: 'user-1' },
      error: null,
    }
  );
  const updateSelect = vi.fn().mockReturnValue({
    maybeSingle: updateMaybeSingle,
  });
  const updateEqBusiness = vi.fn().mockReturnValue({ select: updateSelect });
  const updateEqId = vi.fn().mockReturnValue({ eq: updateEqBusiness });
  const update = vi.fn().mockReturnValue({ eq: updateEqId });

  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: selectEqId }),
      update,
    })),
    update,
  };
}

describe('updateBookingAssignee', () => {
  it('saves the worker on that shop booking', async () => {
    const admin = createAdmin({});

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'user-1',
      })
    ).resolves.toEqual({
      ok: true,
      assignedUserId: 'user-1',
      previousAssignedUserId: null,
    });
  });

  it('returns 404 when the booking is not on this shop', async () => {
    const admin = createAdmin({ existing: null });

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

  it('returns 409 when the appointment is cancelled', async () => {
    const admin = createAdmin({
      existing: { id: 'b1', status: 'cancelled' },
    });

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'user-1',
      })
    ).resolves.toEqual({
      ok: false,
      error: 'Completed or cancelled appointments can’t change assignee.',
      status: 409,
    });
    expect(admin.update).not.toHaveBeenCalled();
  });

  it('returns 409 when the appointment is already completed', async () => {
    const admin = createAdmin({
      existing: { id: 'b1', status: 'completed' },
    });

    await expect(
      updateBookingAssignee(admin as never, {
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'user-1',
      })
    ).resolves.toEqual({
      ok: false,
      error: 'Completed or cancelled appointments can’t change assignee.',
      status: 409,
    });
    expect(admin.update).not.toHaveBeenCalled();
  });

  it('returns 400 when the trigger rejects the user', async () => {
    const admin = createAdmin({
      update: {
        data: null,
        error: { code: '23514', message: 'check' },
      },
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
