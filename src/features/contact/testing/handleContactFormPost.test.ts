import { handleContactFormPost } from '@/features/contact/server/handleContactFormPost';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertContactFormRateLimitsMock,
  assertReasonableJsonBodySizeMock,
  tryGetAuthenticatedUserMock,
  requestHasBearerAuthMock,
} = vi.hoisted(() => ({
  assertContactFormRateLimitsMock: vi.fn(),
  assertReasonableJsonBodySizeMock: vi.fn(),
  tryGetAuthenticatedUserMock: vi.fn(),
  requestHasBearerAuthMock: vi.fn(),
}));

vi.mock('@/server/rateLimit/publicApiRateLimit', () => ({
  assertContactFormRateLimits: assertContactFormRateLimitsMock,
  assertReasonableJsonBodySize: assertReasonableJsonBodySizeMock,
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  tryGetAuthenticatedUser: tryGetAuthenticatedUserMock,
  requestHasBearerAuth: requestHasBearerAuthMock,
}));

vi.mock('@/features/contact/server/resolveContactSubmitterFromAuth', () => ({
  resolveContactSubmitterFromAuth: vi.fn(),
}));

import { resolveContactSubmitterFromAuth } from '@/features/contact/server/resolveContactSubmitterFromAuth';

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: 'jane@example.com',
  topic: 'feature_request',
  message: 'Please add dark mode to the dashboard.',
  website: '',
};

describe('handleContactFormPost', () => {
  const sendEmail = vi.fn();

  beforeEach(() => {
    sendEmail.mockReset();
    assertReasonableJsonBodySizeMock.mockReturnValue(null);
    assertContactFormRateLimitsMock.mockResolvedValue(null);
    sendEmail.mockResolvedValue({ sent: true });
    tryGetAuthenticatedUserMock.mockResolvedValue(null);
    requestHasBearerAuthMock.mockReturnValue(false);
    vi.mocked(resolveContactSubmitterFromAuth).mockReset();
  });

  it('returns success when email sends', async () => {
    const res = await handleContactFormPost(postRequest(validBody), {
      sendEmail,
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(sendEmail).toHaveBeenCalledWith({
      name: 'jane',
      email: 'jane@example.com',
      topic: 'feature_request',
      message: 'Please add dark mode to the dashboard.',
    });
    expect(assertContactFormRateLimitsMock).toHaveBeenCalledWith(
      expect.any(NextRequest),
      'jane@example.com'
    );
  });

  it('returns validation error for invalid body', async () => {
    const res = await handleContactFormPost(
      postRequest({ ...validBody, email: 'not-email' }),
      { sendEmail }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_ERROR');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns rate limited when limits exceeded', async () => {
    assertContactFormRateLimitsMock.mockResolvedValue(
      NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '120' } }
      )
    );

    const res = await handleContactFormPost(postRequest(validBody), {
      sendEmail,
    });
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.code).toBe('RATE_LIMITED');
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('uses authenticated user email and name when session is valid', async () => {
    tryGetAuthenticatedUserMock.mockResolvedValue({
      user: { id: 'u1', email: 'owner@example.com' },
      supabase: {},
      authMethod: 'cookie',
    });
    vi.mocked(resolveContactSubmitterFromAuth).mockResolvedValue({
      name: 'Acme Plumbing',
      email: 'owner@example.com',
    });

    const res = await handleContactFormPost(
      postRequest({
        topic: 'bug_report',
        message: 'Dashboard stats look wrong after refresh.',
        website: '',
      }),
      { sendEmail }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(sendEmail).toHaveBeenCalledWith({
      name: 'Acme Plumbing',
      email: 'owner@example.com',
      topic: 'bug_report',
      message: 'Dashboard stats look wrong after refresh.',
    });
  });

  it('returns unauthorized when bearer token is invalid', async () => {
    requestHasBearerAuthMock.mockReturnValue(true);
    tryGetAuthenticatedUserMock.mockResolvedValue(null);

    const res = await handleContactFormPost(
      postRequest({
        topic: 'other',
        message: 'Need help with billing setup please.',
        website: '',
      }),
      { sendEmail }
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.code).toBe('UNAUTHORIZED');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns email send failed on Resend error', async () => {
    sendEmail.mockResolvedValue({
      sent: false,
      error: 'RESEND_API_KEY is not set',
    });

    const res = await handleContactFormPost(postRequest(validBody), {
      sendEmail,
    });
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.code).toBe('EMAIL_SEND_FAILED');
  });
});
