import type { ContactTopic } from '@/features/contact/types';

export type ContactFormSubmissionPayload = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
};

export type SendContactFormSubmissionResult =
  | { sent: true }
  | { sent: false; error: string };
