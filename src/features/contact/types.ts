export const CONTACT_TOPICS = [
  'feature_request',
  'bug_report',
  'other',
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactFormFields = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
};

export type ParsedContactFormBody = ContactFormFields;

/** JSON body for POST /api/contact (public web + mobile, unsigned). */
export type ContactFormSubmitBody = {
  email: string;
  topic: ContactTopic;
  message: string;
  /** Honeypot — must be empty. Mobile should omit or send `""`. */
  website?: string;
};

export type AuthenticatedContactFormFields = {
  topic: ContactTopic;
  message: string;
};

/** JSON body for POST /api/contact when the user is signed in (app). */
export type AuthenticatedContactFormSubmitBody =
  AuthenticatedContactFormFields & {
    website?: string;
  };

export type ContactFormApiErrorCode =
  | 'INVALID_JSON'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'EMAIL_SEND_FAILED'
  | 'SERVER_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'UNAUTHORIZED';

export type ContactFormSubmitSuccessResponse = {
  success: true;
};

export type ContactFormSubmitErrorResponse = {
  success: false;
  error: string;
  code: ContactFormApiErrorCode;
};

export type ContactFormSubmitResponse =
  | ContactFormSubmitSuccessResponse
  | ContactFormSubmitErrorResponse;
