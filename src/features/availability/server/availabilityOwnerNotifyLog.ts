import { structuredLog } from '@/server/logging/structuredLog';

const SCOPE = 'availability-owner-notify';

export type AvailabilityOwnerNotifyLogLevel = 'info' | 'warn' | 'error';

export function logAvailabilityOwnerNotify(
  correlationId: string | undefined,
  level: AvailabilityOwnerNotifyLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  structuredLog(SCOPE, correlationId, level, event, meta);
}
