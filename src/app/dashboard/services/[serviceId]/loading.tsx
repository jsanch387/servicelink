/**
 * Loading state for service edit page.
 * Uses edit-specific skeleton (not the services list skeleton).
 */

import { ServiceEditLoadingSkeleton } from '@/features/services';

export default function ServiceEditLoading() {
  return <ServiceEditLoadingSkeleton />;
}
