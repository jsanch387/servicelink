import {
  getResourcesPageMetadata,
  ResourcesPageShell,
  ResourcesStructuredData,
} from '@/features/resources';

export const metadata = getResourcesPageMetadata();

export default function ResourcesPage() {
  return (
    <>
      <ResourcesStructuredData />
      <ResourcesPageShell />
    </>
  );
}
