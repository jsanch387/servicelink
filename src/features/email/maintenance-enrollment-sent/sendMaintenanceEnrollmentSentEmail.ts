/**
 * Sends the maintenance enrollment review link to the customer (best-effort).
 * Same pattern as quote-sent: failures are logged by caller; enrollment row is not rolled back.
 */

import { getFromEmail, getResendClient } from '../services/resendClient';
import {
  buildMaintenanceEnrollmentSentHtml,
  buildMaintenanceEnrollmentSentPlainText,
  getMaintenanceEnrollmentSentSubject,
} from './maintenanceEnrollmentSentTemplate';
import type {
  MaintenanceEnrollmentSentPayload,
  SendMaintenanceEnrollmentSentResult,
} from './types';

export async function sendMaintenanceEnrollmentSentEmail(
  to: string,
  payload: MaintenanceEnrollmentSentPayload
): Promise<SendMaintenanceEnrollmentSentResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const subject = getMaintenanceEnrollmentSentSubject(payload.businessName);
  const html = buildMaintenanceEnrollmentSentHtml(payload);
  const text = buildMaintenanceEnrollmentSentPlainText(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to.trim()],
    subject,
    html,
    text,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
