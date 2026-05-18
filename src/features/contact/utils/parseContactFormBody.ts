import type { ContactTopic, ParsedContactFormBody } from '../types';
import { getContactFormFieldErrors } from './validateContactFormFields';

export type ParseContactFormBodyResult =
  | { ok: true; data: ParsedContactFormBody }
  | { ok: false; error: string };

/**
 * Validates public contact form JSON. Rejects honeypot (`website`) when filled.
 */
export function parseContactFormBody(
  body: unknown
): ParseContactFormBodyResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const record = body as Record<string, unknown>;

  const honeypot =
    typeof record.website === 'string' ? record.website.trim() : '';
  if (honeypot) {
    return { ok: false, error: 'Invalid submission' };
  }

  const fieldErrors = getContactFormFieldErrors(body);
  if (fieldErrors) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, error: first ?? 'Invalid request body' };
  }

  const name = (record.name as string).trim();
  const email = (record.email as string).trim();
  const topic = (record.topic as string).trim() as ContactTopic;
  const message = (record.message as string).trim();

  return {
    ok: true,
    data: { name, email, topic, message },
  };
}
