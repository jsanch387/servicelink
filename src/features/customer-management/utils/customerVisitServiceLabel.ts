import { parseStoredBookingJobDetails } from '@/features/availability/booking/utils/parseStoredBookingJobDetails';
import { parseStoredBookingServiceName } from '@/features/availability/booking/utils/parseStoredBookingServiceName';

const MORE_SUFFIX = /^(.*)\s\+\s(\d+)\s+more$/;

/**
 * History row label: service name only.
 * A pricing option stored as "Name — SUV" is dropped.
 * Extra jobs on the visit become "+ 2 more".
 */
export function customerVisitServiceLabel(
  storedName: string | null | undefined,
  jobDetails?: unknown
): string {
  const jobs = parseStoredBookingJobDetails(jobDetails);
  if (jobs.length > 0) {
    const name = jobs[0]?.serviceName.trim() || 'Visit';
    const extra = jobs.length - 1;
    return extra > 0 ? `${name} + ${extra} more` : name;
  }

  const trimmed = storedName?.trim() ?? '';
  if (!trimmed) return 'Visit';

  const more = trimmed.match(MORE_SUFFIX);
  const base = (more?.[1] ?? trimmed).trim();
  const extra = more ? Number(more[2]) : 0;
  const name =
    parseStoredBookingServiceName(base).serviceName.trim() || 'Visit';
  return extra > 0 ? `${name} + ${extra} more` : name;
}
