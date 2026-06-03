import { PATCH } from '@/app/api/reviews/[id]/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createSupabaseServerClientMock,
  resolveCurrentBusinessIdMock,
  validateUpdateReviewBodyMock,
  updateDashboardReviewMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  validateUpdateReviewBodyMock: vi.fn(),
  updateDashboardReviewMock: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock('@/features/reviews/dashboard/server/validateUpdateReviewBody', () => ({
  validateUpdateReviewBody: validateUpdateReviewBodyMock,
}));

vi.mock('@/features/reviews/dashboard/server/updateDashboardReview', () => ({
  updateDashboardReview: updateDashboardReviewMock,
}));

function patchRequest(body: string): Request {
  return new Request('http://localhost/api/reviews/rev-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('PATCH /api/reviews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClientMock.mockResolvedValue({} as never);
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
  });

  it('returns 400 for missing review id', async () => {
    const res = await PATCH(patchRequest('{}'), {
      params: Promise.resolve({ id: '   ' }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Review id is required' });
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await PATCH(patchRequest('{'), {
      params: Promise.resolve({ id: 'rev-1' }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Invalid JSON body' });
    expect(validateUpdateReviewBodyMock).not.toHaveBeenCalled();
  });

  it('returns 400 when body validation fails', async () => {
    validateUpdateReviewBodyMock.mockReturnValue({
      ok: false,
      error: 'Reply cannot be empty',
    });

    const res = await PATCH(
      patchRequest(JSON.stringify({ ownerReplyBody: '' })),
      {
        params: Promise.resolve({ id: 'rev-1' }),
      }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Reply cannot be empty' });
  });

  it('returns helper errors from update', async () => {
    validateUpdateReviewBodyMock.mockReturnValue({
      ok: true,
      value: { ownerReplyBody: 'Thanks!' },
    });
    updateDashboardReviewMock.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Review not found',
    });

    const res = await PATCH(
      patchRequest(JSON.stringify({ ownerReplyBody: 'Thanks!' })),
      { params: Promise.resolve({ id: 'rev-1' }) }
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({ success: false, error: 'Review not found' });
  });

  it('returns updated review on success', async () => {
    validateUpdateReviewBodyMock.mockReturnValue({
      ok: true,
      value: { ownerReplyBody: 'Thanks!' },
    });
    updateDashboardReviewMock.mockResolvedValue({
      ok: true,
      review: {
        id: 'rev-1',
        ownerReply: { body: 'Thanks!', repliedAt: 'now' },
      },
    });

    const res = await PATCH(
      patchRequest(JSON.stringify({ ownerReplyBody: 'Thanks!' })),
      { params: Promise.resolve({ id: 'rev-1' }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.review.id).toBe('rev-1');
  });
});
