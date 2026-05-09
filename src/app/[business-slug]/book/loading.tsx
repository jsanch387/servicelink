import { BookPageLoadingShell } from './BookPageLoadingShell';

/**
 * Skeleton depends on `?bookLoad=configure|calendar` (set from profile / picker links)
 * and `?serviceId=` — avoids showing the calendar shell before a configure-first service.
 */
export default function BookPageLoading() {
  return <BookPageLoadingShell />;
}
