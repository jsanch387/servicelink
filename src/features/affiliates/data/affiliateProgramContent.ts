import { ROUTES } from '@/constants/routes';
import { AFFONSO_COOKIE_DURATION_DAYS } from '@/features/marketing-attribution/constants';
import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const AFFILIATES_PAGE_PATH = ROUTES.AFFILIATES;
export const AFFILIATES_CANONICAL_URL = `${SITE_URL}${AFFILIATES_PAGE_PATH}`;

/** Affonso affiliate portal. Override with NEXT_PUBLIC_AFFONSO_AFFILIATE_PORTAL_URL. */
export const AFFILIATE_PORTAL_URL =
  process.env.NEXT_PUBLIC_AFFONSO_AFFILIATE_PORTAL_URL?.trim() ||
  'https://servicelink.affonso.io';

export const AFFILIATE_COMMISSION = {
  percent: 30,
  proMonthlyUsd: 20,
  perReferralMonthlyUsd: 6,
} as const;

export const AFFILIATE_HERO = {
  eyebrow: 'Affiliate program',
  title: 'Earn 30% on every Pro plan you refer',
  subtitle:
    'ServiceLink Pro is $20 a month. Send someone who upgrades, and you earn $6 every month they stay subscribed.',
  seoTitle: 'ServiceLink Affiliate Program',
  seoDescription:
    'Earn 30% recurring commission when a detailer subscribes to ServiceLink Pro ($20/mo). That’s $6 a month per referral. Apply in a few minutes.',
} as const;

export const AFFILIATE_STEPS = [
  {
    step: '01',
    title: 'Apply',
    body: 'Create your affiliate account and get a unique link. We only attribute visits that come through your link.',
  },
  {
    step: '02',
    title: 'Share',
    body: 'Send it to detailers, post it in your content, or drop it in a group. The cookie lasts 30 days.',
  },
  {
    step: '03',
    title: 'Earn',
    body: 'When they subscribe to Pro, you get 30% — $6 a month on a $20 plan, for as long as they stay on Pro.',
  },
] as const;

export const AFFILIATE_EARNING_EXAMPLES = [
  { referrals: 5, monthlyUsd: 30, yearlyUsd: 360 },
  { referrals: 10, monthlyUsd: 60, yearlyUsd: 720 },
  { referrals: 20, monthlyUsd: 120, yearlyUsd: 1440 },
] as const;

export const AFFILIATE_WHO = [
  {
    title: 'Detailers',
    body: 'People already ask what you use. Send your link instead of a generic recommendation.',
  },
  {
    title: 'Creators',
    body: 'YouTube, Instagram, TikTok, newsletters — if you talk shop, this is an easy mention.',
  },
  {
    title: 'Communities',
    body: 'Groups, coaches, and podcasts that help operators get booked and get paid.',
  },
] as const;

export const AFFILIATE_FAQS = [
  {
    question: 'How much do I actually make?',
    answer:
      '30% of ServiceLink Pro. Pro is $20 a month, so one referred subscriber is $6 a month. Ten subscribers is $60 a month — $720 a year if they stay.',
  },
  {
    question: 'Do I earn on free accounts?',
    answer:
      'No. Signups are tracked as leads. Commission starts when they subscribe to Pro through your link.',
  },
  {
    question: 'How long does my link last?',
    answer: `The referral cookie lasts ${AFFONSO_COOKIE_DURATION_DAYS} days. If they visit through your link and subscribe to Pro inside that window, you get credit.`,
  },
  {
    question: 'How do I get paid?',
    answer:
      'Apply in the affiliate portal, share your link, and track referrals there. Payouts are handled automatically through our affiliate partner.',
  },
] as const;

export function getAffiliateProgramMetadata(): Metadata {
  return {
    title: AFFILIATE_HERO.seoTitle,
    description: AFFILIATE_HERO.seoDescription,
    alternates: {
      canonical: AFFILIATES_CANONICAL_URL,
    },
    openGraph: {
      title: `${AFFILIATE_HERO.seoTitle} | ServiceLink`,
      description: AFFILIATE_HERO.seoDescription,
      url: AFFILIATES_CANONICAL_URL,
      siteName: 'ServiceLink',
      type: 'website',
    },
  };
}
