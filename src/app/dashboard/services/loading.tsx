/**
 * Loading state for Services page.
 * Shows skeleton while services are fetched server-side.
 */

import { ServicesLoadingSkeleton } from '@/features/services';

export default function ServicesLoading() {
  return <ServicesLoadingSkeleton />;
}
