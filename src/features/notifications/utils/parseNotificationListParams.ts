import {
  NOTIFICATIONS_MAX_PAGE_SIZE,
  NOTIFICATIONS_PAGE_SIZE,
} from '../constants';
import type { NotificationInboxFilter } from '../types/notification';

export function parseNotificationListParams(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
  filter: NotificationInboxFilter;
} {
  const rawLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const rawOffset = Number.parseInt(searchParams.get('offset') ?? '', 10);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(NOTIFICATIONS_MAX_PAGE_SIZE, Math.max(1, rawLimit))
    : NOTIFICATIONS_PAGE_SIZE;

  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
  const filter: NotificationInboxFilter =
    searchParams.get('filter') === 'recent' ? 'recent' : 'new';

  return { limit, offset, filter };
}
