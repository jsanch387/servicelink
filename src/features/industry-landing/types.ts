import { ROUTES } from '@/constants/routes';

export type IndustryId = 'auto-detailing';

export type IndustryFaq = {
  question: string;
  answer: string;
};

export type IndustryFeatureTile = {
  id: string;
  title: string;
  line: string;
  /** Drop a real screenshot here later. Code mock renders until then. */
  screenshotSrc?: string | null;
  screenshotAlt: string;
};

export type IndustryComparisonRow = {
  feature: string;
  servicelink: boolean;
  generic: boolean;
};

export type IndustryLandingContent = {
  id: IndustryId;
  path: typeof ROUTES.AUTO_DETAILING;
  seo: {
    title: string;
    description: string;
    keywords: readonly string[];
    ogTitle: string;
  };
  hero: {
    eyebrow: string;
    h1: string;
    h1Accent: string;
    sub: string;
  };
  howItWorks: {
    heading: string;
    steps: readonly { id: string; title: string; line: string }[];
  };
  features: {
    heading: string;
    tiles: readonly IndustryFeatureTile[];
  };
  mobileOrShop: {
    heading: string;
    sub: string;
    mobile: { title: string; line: string };
    shop: { title: string; line: string };
  };
  comparison: {
    heading: string;
    sub: string;
    rows: readonly IndustryComparisonRow[];
    links: readonly { href: string; label: string }[];
  };
  faqs: readonly IndustryFaq[];
  cta: {
    heading: string;
    line: string;
  };
};
