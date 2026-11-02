import { getPublicPaymentLinkPath } from '@/constants/routes';
import {
  PAYMENT_LINK_SHARE_DESCRIPTION,
  PAYMENT_LINK_SHARE_TITLE,
} from '@/features/payments/walk-up/constants';
import { PublicPaymentLinkPage } from '@/features/payments/walk-up/PublicPaymentLinkPage';
import { loadPublicPaymentRequestByShortCode } from '@/features/payments/walk-up/loadPublicPaymentRequestByShortCode';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PublicPaymentLinkPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: PublicPaymentLinkPageProps): Promise<Metadata> {
  const { code } = await params;
  const raw = decodeURIComponent(code ?? '').trim();
  const siteUrl = getAppBaseUrl().replace(/\/$/, '');
  const pagePath = raw ? getPublicPaymentLinkPath(raw) : '/p';
  const pageUrl = `${siteUrl}${pagePath}`;
  const iconUrl = `${pagePath}/icon`;
  const appleIconUrl = `${pagePath}/apple-icon`;

  return {
    title: { absolute: PAYMENT_LINK_SHARE_TITLE },
    description: PAYMENT_LINK_SHARE_DESCRIPTION,
    applicationName: PAYMENT_LINK_SHARE_TITLE,
    robots: { index: false, follow: false },
    icons: {
      icon: [{ url: iconUrl, type: 'image/png' }],
      shortcut: [{ url: iconUrl, type: 'image/png' }],
      apple: [{ url: appleIconUrl, sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: PAYMENT_LINK_SHARE_TITLE,
      description: PAYMENT_LINK_SHARE_DESCRIPTION,
      siteName: PAYMENT_LINK_SHARE_TITLE,
    },
    twitter: {
      card: 'summary',
      title: PAYMENT_LINK_SHARE_TITLE,
      description: PAYMENT_LINK_SHARE_DESCRIPTION,
    },
  };
}

export default async function PublicPaymentLinkRoute({
  params,
}: PublicPaymentLinkPageProps) {
  const { code } = await params;
  const raw = decodeURIComponent(code ?? '').trim();
  if (!raw) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const loaded = await loadPublicPaymentRequestByShortCode(admin, raw);
  if (!loaded.ok) {
    notFound();
  }

  return <PublicPaymentLinkPage payment={loaded.payment} />;
}
