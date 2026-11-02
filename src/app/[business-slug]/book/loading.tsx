import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';

/** Book funnel keeps echo bars; the profile skeleton stays on `/{slug}` only. */
export default function PublicBookLoading() {
  return <BookFlowLoadingState />;
}
