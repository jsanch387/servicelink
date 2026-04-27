/**
 * Sends a "trial ending soon" reminder email before the first charge.
 */

import { ROUTES } from '@/constants/routes';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import { escapeHtml } from '../utils/escapeHtml';
import type {
  SendTrialEndingSoonEmailParams,
  SendTrialEndingSoonEmailResult,
} from './types';

const SUBJECT = 'Your ServiceLink trial ends soon';

function formatTrialEndDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function buildHtml({
  trialEndLabel,
  settingsUrl,
}: {
  trialEndLabel: string | null;
  settingsUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">Hey there,</p>
  <p style="margin: 0 0 16px;">We hope you've enjoyed your ServiceLink trial so far.</p>
  <p style="margin: 0 0 24px;">Your trial${trialEndLabel ? ` ends on <strong>${escapeHtml(trialEndLabel)}</strong>` : ' is ending soon'}. To keep all Pro features and stay live, make sure your billing details are up to date.</p>
  <p style="margin: 0 0 24px;">
    <a href="${settingsUrl}" style="display: inline-block; background: #171717; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Manage subscription</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">Thanks for trying ServiceLink.</p>
</body>
</html>
`.trim();
}

export async function sendTrialEndingSoonEmail(
  to: string,
  params: SendTrialEndingSoonEmailParams = {}
): Promise<SendTrialEndingSoonEmailResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const trialEndLabel = formatTrialEndDate(params.trialEndsAtIso ?? null);
  const settingsUrl = `${getAppBaseUrl()}${ROUTES.DASHBOARD.SETTINGS}`;

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to],
    subject: SUBJECT,
    html: buildHtml({ trialEndLabel, settingsUrl }),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
