import { CONTACT_TOPIC_LABEL } from '@/features/contact/constants';
import type { ContactTopic } from '@/features/contact/types';
import { escapeHtml } from '../utils/escapeHtml';
import type { ContactFormSubmissionPayload } from './types';

export function getContactFormSubmissionSubject(
  topic: ContactTopic,
  name: string
): string {
  const label = CONTACT_TOPIC_LABEL[topic];
  return `[${label}] Message from ${name}`;
}

export function buildContactFormSubmissionHtml(
  payload: ContactFormSubmissionPayload
): string {
  const topicLabel = CONTACT_TOPIC_LABEL[payload.topic];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(getContactFormSubmissionSubject(payload.topic, payload.name))}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0;">New contact form submission</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Topic</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(topicLabel)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.name)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
  </table>
  <h3 style="margin-bottom: 8px;">Message</h3>
  <p style="white-space: pre-wrap; margin: 0; padding: 16px; background: #f4f4f5; border-radius: 8px;">${escapeHtml(payload.message)}</p>
  <p style="color: #666; font-size: 14px; margin-top: 24px;">Reply directly to this email to reach the sender.</p>
</body>
</html>
`.trim();
}

export function buildContactFormSubmissionPlainText(
  payload: ContactFormSubmissionPayload
): string {
  const topicLabel = CONTACT_TOPIC_LABEL[payload.topic];
  return [
    'New contact form submission',
    '',
    `Topic: ${topicLabel}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    '',
    'Message:',
    payload.message,
  ].join('\n');
}
