import { getFromEmail, getResendClient } from '../services/resendClient';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';
import {
  buildMaintenanceEnrollmentConfirmedHtml,
  buildMaintenanceEnrollmentConfirmedPlainText,
  getMaintenanceEnrollmentConfirmedSubject,
} from './maintenanceEnrollmentConfirmedTemplate';
import type {
  MaintenanceEnrollmentConfirmedPayload,
  SendMaintenanceEnrollmentConfirmedResult,
} from './types';

export async function sendMaintenanceEnrollmentConfirmedEmail(
  to: string,
  payload: MaintenanceEnrollmentConfirmedPayload
): Promise<SendMaintenanceEnrollmentConfirmedResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const recipient = normalizedCustomerRecipientEmail(to);
  if (!recipient) {
    return { sent: false, error: 'Customer has no email on file' };
  }

  const subject = getMaintenanceEnrollmentConfirmedSubject(
    payload.businessName
  );
  const html = buildMaintenanceEnrollmentConfirmedHtml(payload);
  const text = buildMaintenanceEnrollmentConfirmedPlainText(payload);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [recipient],
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
