import { handleContactFormPost } from '@/features/contact/server/handleContactFormPost';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assertContactFormRateLimitsMock, assertReasonableJsonBodySizeMock } =
  vi.hoisted(() => ({
    assertContactFormRateLimitsMock: vi.fn(),
    assertReasonableJsonBodySizeMock: vi.fn(),
  }));

vi.mock('@/server/rateLimit/publicApiRateLimit', () => ({
  assertContactFormRateLimits: assertContactFormRateLimitsMock,
  assertReasonableJsonBodySize: assertReasonableJsonBodySizeMock,
}));

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: 'Jane Smith',
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
  });

  it('returns success when email sends', async () => {
    const res = await handleContactFormPost(postRequest(validBody), {
      sendEmail,
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(sendEmail).toHaveBeenCalledWith({
      name: 'Jane Smith',
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
