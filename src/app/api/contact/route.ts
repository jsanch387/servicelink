/**
 * POST /api/contact
 *
 * Public support form — web `/contact` and native app (no auth).
 * Sends email to ServiceLink support via Resend.
 *
 * @see docs/contracts/mobile-contact-form.md
 */

import { handleContactFormPost } from '@/features/contact/server/handleContactFormPost';
import { contactFormJsonResponse } from '@/features/contact/server/contactFormJsonResponse';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleContactFormPost(request);
}

export async function GET() {
  return contactFormJsonResponse(
    {
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    },
    405,
    { Allow: 'POST' }
  );
}
