import { FeaturesPage } from '@/features/landing-page/components/FeaturesPage';
import { FeaturesStructuredData } from '@/features/landing-page/components/FeaturesStructuredData';
import { getFeaturesPageMetadata } from '@/features/landing-page/data/featuresSeoContent';

export const metadata = getFeaturesPageMetadata();

export default function FeaturesRoutePage() {
  return (
    <>
      <FeaturesStructuredData />
      <FeaturesPage />
    </>
  );
}
