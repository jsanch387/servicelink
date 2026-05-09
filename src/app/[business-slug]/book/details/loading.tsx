import { BookServiceDetailsLoadingSkeleton } from '@/features/services/booking-flow';

/** Brief flash while `/book/details` redirects to `/book`. */
export default function BookDetailsLoading() {
  return <BookServiceDetailsLoadingSkeleton />;
}
