import { WorkshopWatchPage } from '@/features/ads-workshop';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'Watch — Run Local Ads Workshop | ServiceLink',
  description:
    'Watch the free masterclass on running local Facebook and Instagram ads for your service business.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/workshop/watch`,
  },
};

export default function WorkshopWatchRoutePage() {
  return <WorkshopWatchPage />;
}
