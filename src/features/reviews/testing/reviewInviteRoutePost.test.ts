import { POST } from '@/app/api/availability/bookings/[id]/review-invite/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  resolveCurrentBusinessIdMock,
  requestReviewInviteForBookingMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  requestReviewInviteForBookingMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock('@/features/reviews/server/requestReviewInviteForBooking', () => ({
  requestReviewInviteForBooking: requestReviewInviteForBookingMock,
}));

describe('POST /api/availability/bookings/[id]/review-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'user-12345678-abcd' },
      supabase: {},
      authMethod: 'bearer',
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
  });

  it('returns skipped payload', async () => {
    requestReviewInviteForBookingMock.mockResolvedValue({
      ok: true,
      sent: false,
      skipped: true,
      reason: 'no_customer_email',
    });

    const res = await POST(
      new NextRequest('http://test', {
        headers: { 'X-Request-ID': 'mobile-test-req' },
      }),
      { params: Promise.resolve({ id: 'booking-1' }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-ID')).toBe('mobile-test-req');
    expect(json).toEqual({
      success: true,
      sent: false,
      skipped: true,
      reason: 'no_customer_email',
    });
  });

  it('returns sent payload', async () => {
    requestReviewInviteForBookingMock.mockResolvedValue({
      ok: true,
      sent: true,
      skipped: false,
      inviteId: 'inv-99',
    });

    const res = await POST(new NextRequest('http://test'), {
      params: Promise.resolve({ id: 'booking-1' }),
    });
    const json = await res.json();

    expect(json).toEqual({
      success: true,
      sent: true,
      skipped: false,
      inviteId: 'inv-99',
    });
  });
});
