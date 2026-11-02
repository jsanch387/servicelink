import { BusinessProfileLoadingState } from '@/features/business-profile/components/BusinessProfileLoadingState';

/** First paint for `/{slug}` (public booking link / profile). */
export default function PublicBusinessSlugLoading() {
  return <BusinessProfileLoadingState />;
}
