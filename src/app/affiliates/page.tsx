import {
  AffiliateProgramPage,
  AffiliateProgramStructuredData,
  getAffiliateProgramMetadata,
} from '@/features/affiliates';

export const metadata = getAffiliateProgramMetadata();

export default function AffiliatesRoutePage() {
  return (
    <>
      <AffiliateProgramStructuredData />
      <AffiliateProgramPage />
    </>
  );
}
