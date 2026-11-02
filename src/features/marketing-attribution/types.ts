export type MarketingUtmAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  landingPath?: string;
  referrer?: string;
  capturedAt?: string;
};

export type SignupAttributionRow = {
  user_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  landing_path: string | null;
  referrer: string | null;
  channel: string | null;
  signed_up_at: string;
  first_paid_at: string | null;
};

export type PaidConversionPeriod = '30d' | '90d' | 'all';

export type PaidConversionCounts = {
  signups: number;
  everPaid: number;
  currentlyPaying: number;
  conversionRate: number;
};

export type PaidConversionChannelRow = PaidConversionCounts & {
  channel: string;
};

export type PaidConversionCampaignRow = PaidConversionCounts & {
  channel: string;
  campaign: string;
  source: string;
  medium: string;
};

export type PaidConversionReport = {
  generatedAt: string;
  period: PaidConversionPeriod;
  totals: PaidConversionCounts;
  paidAds: PaidConversionCounts;
  byChannel: PaidConversionChannelRow[];
  byCampaign: PaidConversionCampaignRow[];
};

export type SaveSignupAttributionResult =
  | { ok: true; recorded: boolean }
  | { ok: false; error: string; status: number };
