import { GET } from '@/app/api/reviews/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createSupabaseServerClientMock,
  resolveCurrentBusinessIdMock,
  loadDashboardReviewsMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  loadDashboardReviewsMock: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock('@/features/reviews/dashboard/server/loadDashboardReviews', () => ({
  loadDashboardReviews: loadDashboardReviewsMock,
}));

describe('GET /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClientMock.mockResolvedValue({} as never);
  });

  it('returns auth/business resolution errors', async () => {
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'Unauthorized' });
    expect(loadDashboardReviewsMock).not.toHaveBeenCalled();
  });

  it('returns server helper errors', async () => {
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    loadDashboardReviewsMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Failed to load reviews',
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Failed to load reviews' });
  });

  it('returns reviews on success', async () => {
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    loadDashboardReviewsMock.mockResolvedValue({
      ok: true,
      reviews: [{ id: 'rev-1' }],
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, reviews: [{ id: 'rev-1' }] });
  });

  it('returns 500 on unexpected throw', async () => {
    resolveCurrentBusinessIdMock.mockRejectedValue(new Error('boom'));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Unexpected server error' });
  });
});
