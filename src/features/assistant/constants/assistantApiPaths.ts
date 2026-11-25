/** Assistant API paths — local constants so client fetches never POST `/undefined`. */
export const ASSISTANT_API = {
  TODAY: '/api/assistant/today',
  USAGE: '/api/assistant/usage',
  SKIP: '/api/assistant/skip',
  SEND: '/api/assistant/send',
  REVIEW_LINKS: '/api/assistant/review-links',
  CHAT: '/api/assistant/chat',
} as const;
