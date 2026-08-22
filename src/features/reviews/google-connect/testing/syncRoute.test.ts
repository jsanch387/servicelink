import { POST } from '@/app/api/reviews/google/sync/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  resolveCurrentBusinessIdMock,
  syncGoogleBusinessListingMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  syncGoogleBusinessListingMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock(
  '@/features/reviews/google-connect/server/syncGoogleBusinessListing',
  () => ({
    syncGoogleBusinessListing: syncGoogleBusinessListingMock,
  })
);

describe('POST /api/reviews/google/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns listing details when Google finds a location', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
      authMethod: 'cookie',
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    syncGoogleBusinessListingMock.mockResolvedValue({
      ok: true,
      locationTitle: 'ServiceLink',
      foundLocation: true,
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/reviews/google/sync', {
        method: 'POST',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      locationTitle: 'ServiceLink',
      foundLocation: true,
    });
  });
});
