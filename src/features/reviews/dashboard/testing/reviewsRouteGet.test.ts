import { GET } from '@/app/api/reviews/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  requireBusinessPermissionMock,
  loadDashboardReviewFeedMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  requireBusinessPermissionMock: vi.fn(),
  loadDashboardReviewFeedMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    getAuthenticatedUserMock(...args),
}));

vi.mock('@/features/team/server/requireBusinessPermission', () => ({
  requireBusinessPermission: (...args: unknown[]) =>
    requireBusinessPermissionMock(...args),
}));

vi.mock('@/features/reviews/dashboard/server/loadDashboardReviewFeed', () => ({
  loadDashboardReviewFeed: loadDashboardReviewFeedMock,
}));

const cookieClient = { kind: 'cookie-session' };
const bearerClient = { kind: 'bearer-session' };

function reviewsRequest(headers?: HeadersInit) {
  return new Request('http://localhost/api/reviews', { headers });
}

function signedIn(supabase: object, authMethod: 'cookie' | 'bearer') {
  return {
    user: { id: 'user-1' },
    supabase,
    authMethod,
  };
}

describe('GET /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUserMock.mockResolvedValue(
      signedIn(cookieClient, 'cookie')
    );
    loadDashboardReviewFeedMock.mockResolvedValue({
      ok: true,
      reviews: [],
      hasMore: false,
      summary: { averageRating: 0, reviewCount: 0, breakdown: [] },
    });
  });

  it('returns 401 from the session check without loading reviews', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Authentication required',
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const res = await GET(reviewsRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({
      success: false,
      error: 'Authentication required',
    });
    expect(requireBusinessPermissionMock).not.toHaveBeenCalled();
    expect(loadDashboardReviewFeedMock).not.toHaveBeenCalled();
  });

  it('returns auth/business resolution errors', async () => {
    requireBusinessPermissionMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });

    const res = await GET(reviewsRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'Unauthorized' });
    expect(loadDashboardReviewFeedMock).not.toHaveBeenCalled();
  });

  it('returns server helper errors', async () => {
    requireBusinessPermissionMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    loadDashboardReviewFeedMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Failed to load reviews',
    });

    const res = await GET(reviewsRequest());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Failed to load reviews' });
  });

  it('returns reviews for a website cookie session', async () => {
    requireBusinessPermissionMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    loadDashboardReviewFeedMock.mockResolvedValue({
      ok: true,
      reviews: [{ id: 'rev-1' }],
      hasMore: true,
      summary: { averageRating: 5, reviewCount: 1, breakdown: [] },
    });

    const res = await GET(reviewsRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      reviews: [{ id: 'rev-1' }],
      hasMore: true,
      summary: { averageRating: 5, reviewCount: 1, breakdown: [] },
    });
    expect(requireBusinessPermissionMock).toHaveBeenCalledWith(
      cookieClient,
      'reviews.read'
    );
  });

  it('returns reviews for a mobile bearer session', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      signedIn(bearerClient, 'bearer')
    );
    requireBusinessPermissionMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    loadDashboardReviewFeedMock.mockResolvedValue({
      ok: true,
      reviews: [{ id: 'rev-1' }],
      hasMore: false,
      summary: { averageRating: 5, reviewCount: 1, breakdown: [] },
    });

    const res = await GET(
      reviewsRequest({ Authorization: 'Bearer mobile-token' })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      reviews: [{ id: 'rev-1' }],
      hasMore: false,
      summary: { averageRating: 5, reviewCount: 1, breakdown: [] },
    });
    expect(getAuthenticatedUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          get: expect.any(Function),
        }),
      })
    );
    expect(requireBusinessPermissionMock).toHaveBeenCalledWith(
      bearerClient,
      'reviews.read'
    );
    expect(loadDashboardReviewFeedMock).toHaveBeenCalledWith(
      bearerClient,
      'biz-1',
      expect.objectContaining({ offset: 0 })
    );
  });

  it('returns 500 on unexpected throw', async () => {
    requireBusinessPermissionMock.mockRejectedValue(new Error('boom'));

    const res = await GET(reviewsRequest());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Unexpected server error' });
  });
});
