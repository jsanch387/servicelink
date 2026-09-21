import { PATCH } from '@/app/api/availability/bookings/[id]/assignee/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  requireBusinessPermissionMock,
  updateBookingAssigneeMock,
  notifyAssigneeForJobAssignedMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  requireBusinessPermissionMock: vi.fn(),
  updateBookingAssigneeMock: vi.fn(),
  notifyAssigneeForJobAssignedMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/features/team/server/requireBusinessPermission', () => ({
  requireBusinessPermission: requireBusinessPermissionMock,
}));

vi.mock('@/features/team/server/updateBookingAssignee', () => ({
  updateBookingAssignee: updateBookingAssigneeMock,
}));

vi.mock('@/features/team/server/notifyAssigneeForJobAssigned', () => ({
  notifyAssigneeForJobAssigned: notifyAssigneeForJobAssignedMock,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({}),
}));

function patchAssignee(
  bookingId: string,
  assignedUserId: string | null,
  headers?: HeadersInit
) {
  return PATCH(
    new NextRequest(
      `http://localhost/api/availability/bookings/${bookingId}/assignee`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ assignedUserId }),
      }
    ),
    { params: Promise.resolve({ id: bookingId }) }
  );
}

describe('PATCH /api/availability/bookings/:bookingId/assignee', () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
    requireBusinessPermissionMock.mockReset();
    updateBookingAssigneeMock.mockReset();
    notifyAssigneeForJobAssignedMock.mockReset();
    notifyAssigneeForJobAssignedMock.mockResolvedValue(undefined);
  });

  it('returns 401 when Bearer is missing or invalid', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Invalid or expired session',
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const response = await patchAssignee('b1', 'user-2', {
      Authorization: 'Bearer bad-token',
    });

    expect(response.status).toBe(401);
    expect(updateBookingAssigneeMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the actor is not on the shop', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'stranger' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireBusinessPermissionMock.mockResolvedValue({
      ok: false,
      error: 'Forbidden',
      status: 403,
    });

    const response = await patchAssignee('b1', 'user-2');

    expect(response.status).toBe(403);
    expect(updateBookingAssigneeMock).not.toHaveBeenCalled();
  });

  it('writes via service role and returns data.assignedUserId', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'owner-1' },
      supabase: {},
      authMethod: 'bearer',
    });
    requireBusinessPermissionMock.mockResolvedValue({
      ok: true,
      businessId: 'biz',
      context: { userId: 'owner-1' },
    });
    updateBookingAssigneeMock.mockResolvedValue({
      ok: true,
      assignedUserId: 'user-2',
      previousAssignedUserId: null,
    });

    const response = await patchAssignee('b1', 'user-2');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { assignedUserId: 'user-2' },
    });
    expect(updateBookingAssigneeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        businessId: 'biz',
        bookingId: 'b1',
        assignedUserId: 'user-2',
      })
    );
    expect(notifyAssigneeForJobAssignedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'owner-1',
        previousAssignedUserId: null,
        nextAssignedUserId: 'user-2',
      })
    );
  });
});
