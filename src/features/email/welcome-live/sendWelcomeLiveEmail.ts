import {
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import {
  buildWelcomeLiveHtml,
  WELCOME_LIVE_SUBJECT,
} from './welcomeLiveTemplate';
import type {
  SendWelcomeLiveEmailResult,
  WelcomeLiveEmailPayload,
} from './types';

export async function sendWelcomeLiveEmail(
  to: string,
  payload: WelcomeLiveEmailPayload
): Promise<SendWelcomeLiveEmailResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const html = buildWelcomeLiveHtml(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to],
    subject: WELCOME_LIVE_SUBJECT,
    html,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }

  return { sent: true };
}
