import { LandingPage } from '@/features/landing-page';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'ServiceLink | One Link. Your Services. Get Booked.',
  description:
    'Create a professional booking link for your service business. Share one link—myservicelink.app/yourbusiness—and let customers see your services and book instantly.',
  openGraph: {
    url: siteUrl,
    title: 'ServiceLink | One Link. Your Services. Get Booked.',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function Home() {
  return <LandingPage />;
}
