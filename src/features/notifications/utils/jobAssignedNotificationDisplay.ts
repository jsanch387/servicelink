import { bookingCardServiceTitle } from '@/features/availability/booking/dashboard/utils/bookingCardServiceTitle';
import type { Json } from '@/libs/supabase/client';
import { notificationMinimalDisplayTitle } from './notificationMinimalDisplayTitle';

function metadataServiceName(metadata: Json | null): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return '';
  }
  const serviceName = metadata.serviceName;
  return typeof serviceName === 'string' ? serviceName.trim() : '';
}

/** Body stored before the service-only copy: "Customer · Service — Option". */
function serviceFromStoredBody(body: string | null): string {
  const stored = body?.trim() ?? '';
  if (!stored || stored.startsWith('From ')) return '';
  const separator = ' · ';
  const separatorIndex = stored.indexOf(separator);
  if (separatorIndex === -1) return stored;
  return stored.slice(separatorIndex + separator.length).trim();
}

/** Bell copy for a job assignment: title plus the service name only. */
export function jobAssignedNotificationDisplay(input: {
  body: string | null;
  metadata: Json | null;
}): { title: string; body: string | null } {
  const title = notificationMinimalDisplayTitle(
    'job_assigned',
    'booking',
    'Job assigned'
  );
  const rawService =
    metadataServiceName(input.metadata) || serviceFromStoredBody(input.body);
  if (!rawService) return { title, body: null };
  return { title, body: bookingCardServiceTitle(rawService) };
}
