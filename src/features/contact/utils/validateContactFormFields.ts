import { isValidEmail } from '@/features/auth/utils/validation';

import { CONTACT_TOPICS, type ContactTopic } from '../types';

export const CONTACT_MESSAGE_MAX_LEN = 5000;
export const CONTACT_MESSAGE_MIN_LEN = 10;

export type ContactFormFieldKey = 'email' | 'topic' | 'message';

export type ContactFormFieldErrors = Partial<
  Record<ContactFormFieldKey, string>
>;

export type AuthenticatedContactFormFieldKey = 'topic' | 'message';

export type AuthenticatedContactFormFieldErrors = Partial<
  Record<AuthenticatedContactFormFieldKey, string>
>;

function isContactTopic(value: string): value is ContactTopic {
  return (CONTACT_TOPICS as readonly string[]).includes(value);
}

function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === 'string' && website.trim().length > 0;
}

function validateContactTopicAndMessage(
  record: Record<string, unknown>,
  errors: AuthenticatedContactFormFieldErrors
): void {
  const topicRaw = typeof record.topic === 'string' ? record.topic.trim() : '';
  const message =
    typeof record.message === 'string' ? record.message.trim() : '';

  if (!topicRaw || !isContactTopic(topicRaw)) {
    errors.topic = 'Select what you need help with';
  }

  if (!message) {
    errors.message = 'Message is required';
  } else if (message.length < CONTACT_MESSAGE_MIN_LEN) {
    errors.message = `Message must be at least ${CONTACT_MESSAGE_MIN_LEN} characters`;
  } else if (message.length > CONTACT_MESSAGE_MAX_LEN) {
    errors.message = 'Message is too long';
  }
}

/**
 * Field-level validation for signed-in contact form (topic + message only).
 */
export function getAuthenticatedContactFormFieldErrors(
  body: unknown
): AuthenticatedContactFormFieldErrors | null {
  if (!body || typeof body !== 'object' || isHoneypotFilled(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const errors: AuthenticatedContactFormFieldErrors = {};
  validateContactTopicAndMessage(record, errors);
  return Object.keys(errors).length > 0 ? errors : null;
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

  if (isHoneypotFilled(body)) {
    return null;
  }

  const email = typeof record.email === 'string' ? record.email.trim() : '';

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address';
  }

  validateContactTopicAndMessage(record, errors);

  return Object.keys(errors).length > 0 ? errors : null;
}

export function isValidContactFormEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && isValidEmail(trimmed);
}
