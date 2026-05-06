import { ROUTES } from '@/constants/routes';
import { LandingPage } from '@/features/landing-page';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'ServiceLink | One Link. Your Services. Get Booked.',
  description:
    'Create a professional booking link for your service business. Share one link—myservicelink.app/yourbusiness—and let customers see your services and book instantly.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'ServiceLink | One Link. Your Services. Get Booked.',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
    images: [
      {
        url: '/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'ServiceLink — Your business, ready to book.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServiceLink | One Link. Your Services. Get Booked.',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
    images: ['/open-graph.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
};

function searchParamsToQueryString(
  params: Record<string, string | string[] | undefined>
): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(v => usp.append(key, v));
    } else {
      usp.set(key, value);
    }
  }
  return usp.toString();
}

type HomeSearchParams = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const params = await searchParams;
  const code = params.code;
  const codeValue = Array.isArray(code) ? code[0] : code;
  // OAuth uses `/auth/callback`. Recovery collapsed to Site URL lands on `/?code=`.
  if (codeValue) {
    const qs = searchParamsToQueryString(params);
    redirect(`${ROUTES.AUTH.RESET_PASSWORD}?${qs}`);
  }

  return <LandingPage />;
}
