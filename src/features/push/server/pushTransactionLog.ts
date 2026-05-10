import { structuredLog } from '@/server/logging/structuredLog';

const SCOPE_EXPO = 'expo-push';
const SCOPE_INTERNAL = 'internal-push-send';

export type PushTxLogLevel = 'info' | 'warn' | 'error';

export function logExpoPush(
  level: PushTxLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  structuredLog(SCOPE_EXPO, undefined, level, event, meta);
}

export function logInternalPushSend(
  level: PushTxLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  structuredLog(SCOPE_INTERNAL, undefined, level, event, meta);
}
