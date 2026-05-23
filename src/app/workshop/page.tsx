import {
  AdsWorkshopStructuredData,
  WorkshopGatePage,
} from '@/features/ads-workshop';
import { getWorkshopPageMetadata } from '@/features/ads-workshop/data/workshopSeoContent';

export const metadata = getWorkshopPageMetadata();

export default function WorkshopPage() {
  return (
    <>
      <AdsWorkshopStructuredData />
      <WorkshopGatePage />
    </>
  );
}
