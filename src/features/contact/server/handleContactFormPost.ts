/**
 * POST /api/contact — shared handler for web contact form and mobile app.
 */

import { sendContactFormSubmissionEmail } from '@/features/email/contact-form-submission/sendContactFormSubmissionEmail';
import {
  assertContactFormRateLimits,
  assertReasonableJsonBodySize,
} from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

import { parseContactFormBody } from '../utils/parseContactFormBody';
import { contactFormJsonResponse } from './contactFormJsonResponse';

export const CONTACT_FORM_MAX_BODY_BYTES = 12_000;

export type HandleContactFormPostDeps = {
  sendEmail: typeof sendContactFormSubmissionEmail;
};

const defaultDeps: HandleContactFormPostDeps = {
  sendEmail: sendContactFormSubmissionEmail,
};

export async function handleContactFormPost(
  request: NextRequest,
  deps: HandleContactFormPostDeps = defaultDeps
): Promise<NextResponse> {
  try {
    const tooLarge = assertReasonableJsonBodySize(
      request,
      CONTACT_FORM_MAX_BODY_BYTES
    );
    if (tooLarge) {
      return contactFormJsonResponse(
        {
          success: false,
          error: 'Request body too large',
          code: 'PAYLOAD_TOO_LARGE',
        },
        413
      );
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return contactFormJsonResponse(
        {
          success: false,
          error: 'Invalid JSON body',
          code: 'INVALID_JSON',
        },
        400
      );
    }

    const parsed = parseContactFormBody(json);
    if (!parsed.ok) {
      const isHoneypot = parsed.error === 'Invalid submission';
      return contactFormJsonResponse(
        {
          success: false,
          error: isHoneypot ? 'Invalid submission' : parsed.error,
          code: 'VALIDATION_ERROR',
        },
        400
      );
    }

    const rateLimited = await assertContactFormRateLimits(
      request,
      parsed.data.email
    );
    if (rateLimited) {
      const retryAfter = rateLimited.headers.get('Retry-After');
      return contactFormJsonResponse(
        {
          success: false,
          error:
            'Too many contact requests. Please try again in a few minutes.',
          code: 'RATE_LIMITED',
        },
        429,
        retryAfter ? { 'Retry-After': retryAfter } : undefined
      );
    }

    const sendResult = await deps.sendEmail(parsed.data);
    if (!sendResult.sent) {
      console.error('[contact] email failed:', sendResult.error);
      return contactFormJsonResponse(
        {
          success: false,
          error:
            'We could not send your message right now. Please try again or email us directly.',
          code: 'EMAIL_SEND_FAILED',
        },
        503
      );
    }

    return contactFormJsonResponse({ success: true }, 200);
  } catch (error) {
    console.error('[contact] unexpected error:', error);
    return contactFormJsonResponse(
      {
        success: false,
        error: 'Something went wrong. Please try again.',
        code: 'SERVER_ERROR',
      },
      500
    );
  }
}
