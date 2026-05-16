import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

/** Step 5 “Activate my link” — `POST /api/onboarding-v2/complete` */
export const ONBOARDING_ACTIVATE_LOG_TAG = '[onboarding:activate]';

const REQUEST_ID_HEADERS = ['x-request-id', 'x-correlation-id'] as const;

export function getOnboardingCompleteRequestId(
  request: Pick<NextRequest, 'headers'>
): string {
  for (const name of REQUEST_ID_HEADERS) {
    const raw = request.headers.get(name)?.trim();
    if (raw) return raw.slice(0, 128);
  }
  return randomUUID();
}

/** Simple transactional line — no customer fields. */
export function logOnboardingActivate(message: string): void {
  console.info(`${ONBOARDING_ACTIVATE_LOG_TAG} ${message}`);
}

export function logOnboardingActivateError(message: string): void {
  console.error(`${ONBOARDING_ACTIVATE_LOG_TAG} ${message}`);
}
