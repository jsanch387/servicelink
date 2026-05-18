import type { ContactTopic, ParsedContactFormBody } from '../types';
import { getAuthenticatedContactFormFieldErrors } from './validateContactFormFields';

export type ParseAuthenticatedContactFormBodyResult =
  | { ok: true; data: Pick<ParsedContactFormBody, 'topic' | 'message'> }
  | { ok: false; error: string };

/**
 * Validates signed-in contact form JSON (topic + message). Rejects honeypot when filled.
 */
export function parseAuthenticatedContactFormBody(
  body: unknown
): ParseAuthenticatedContactFormBodyResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const record = body as Record<string, unknown>;

  const honeypot =
    typeof record.website === 'string' ? record.website.trim() : '';
  if (honeypot) {
    return { ok: false, error: 'Invalid submission' };
  }

  const fieldErrors = getAuthenticatedContactFormFieldErrors(body);
  if (fieldErrors) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, error: first ?? 'Invalid request body' };
  }

  const topic = (record.topic as string).trim() as ContactTopic;
  const message = (record.message as string).trim();

  return { ok: true, data: { topic, message } };
}
