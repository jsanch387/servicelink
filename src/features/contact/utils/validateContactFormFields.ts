import { isValidEmail } from '@/features/auth/utils/validation';

import { CONTACT_TOPICS, type ContactTopic } from '../types';

const MAX_NAME_LEN = 120;
const MAX_MESSAGE_LEN = 5000;
const MIN_MESSAGE_LEN = 10;

export type ContactFormFieldKey = 'name' | 'email' | 'topic' | 'message';

export type ContactFormFieldErrors = Partial<
  Record<ContactFormFieldKey, string>
>;

function isContactTopic(value: string): value is ContactTopic {
  return (CONTACT_TOPICS as readonly string[]).includes(value);
}

/**
 * Field-level validation for contact form (web client + shared rules with API).
 */
export function getContactFormFieldErrors(
  body: unknown
): ContactFormFieldErrors | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const errors: ContactFormFieldErrors = {};

  const honeypot =
    typeof record.website === 'string' ? record.website.trim() : '';
  if (honeypot) {
    return null;
  }

  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const topicRaw = typeof record.topic === 'string' ? record.topic.trim() : '';
  const message =
    typeof record.message === 'string' ? record.message.trim() : '';

  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length > MAX_NAME_LEN) {
    errors.name = 'Name is too long';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!topicRaw || !isContactTopic(topicRaw)) {
    errors.topic = 'Select what you need help with';
  }

  if (!message) {
    errors.message = 'Message is required';
  } else if (message.length < MIN_MESSAGE_LEN) {
    errors.message = `Message must be at least ${MIN_MESSAGE_LEN} characters`;
  } else if (message.length > MAX_MESSAGE_LEN) {
    errors.message = 'Message is too long';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function isValidContactFormEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && isValidEmail(trimmed);
}
