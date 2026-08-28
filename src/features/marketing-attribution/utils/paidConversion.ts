import { isProAccess } from '@/features/pricing/utils/isProAccess';
import type {
  PaidConversionCampaignRow,
  PaidConversionCounts,
  PaidConversionPeriod,
  PaidConversionReport,
} from '../types';

export const PAID_AD_CHANNELS = ['meta_ads', 'paid_search'] as const;

export type AttributionConversionInput = {
  channel: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  signed_up_at: string;
  first_paid_at: string | null;
  subscription_tier?: string | null;
  subscription_status?: string | null;
  subscription_current_period_end?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
};

export function isPaidAdChannel(channel: string | null | undefined): boolean {
  const normalized = (channel ?? '').trim().toLowerCase();
  return (PAID_AD_CHANNELS as readonly string[]).includes(normalized);
}

export function isCurrentlyPayingSubscriber(input: {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  subscription_current_period_end?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
}): boolean {
  if (!input.stripe_subscription_id?.trim()) return false;
  return isProAccess(
    input.subscription_tier,
    input.subscription_current_period_end,
    input.subscription_status,
    input.stripe_subscription_id,
    input.stripe_customer_id
  );
}

export function parsePaidConversionPeriod(
  value: string | null | undefined
): PaidConversionPeriod {
  if (value === '30d' || value === '90d' || value === 'all') return value;
  return 'all';
}

export function signedUpAtCutoffIso(
  period: PaidConversionPeriod,
  now = new Date()
): string | null {
  if (period === 'all') return null;
  const days = period === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function emptyCounts(): PaidConversionCounts {
  return { signups: 0, everPaid: 0, currentlyPaying: 0, conversionRate: 0 };
}

function withRate(counts: PaidConversionCounts): PaidConversionCounts {
  return {
    ...counts,
    conversionRate:
      counts.signups === 0
        ? 0
        : Math.round((counts.everPaid / counts.signups) * 1000) / 1000,
  };
}

function bump(
  counts: PaidConversionCounts,
  everPaid: boolean,
  paying: boolean
) {
  counts.signups += 1;
  if (everPaid) counts.everPaid += 1;
  if (paying) counts.currentlyPaying += 1;
}

function label(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function buildPaidConversionReport(
  rows: AttributionConversionInput[],
  period: PaidConversionPeriod,
  now = new Date()
): PaidConversionReport {
  const totals = emptyCounts();
  const paidAds = emptyCounts();
  const byChannel = new Map<string, PaidConversionCounts>();
  const byCampaign = new Map<string, PaidConversionCampaignRow>();

  for (const row of rows) {
    const currentlyPaying = isCurrentlyPayingSubscriber(row);
    const everPaid = Boolean(row.first_paid_at) || currentlyPaying;
    const channel = label(row.channel, 'unknown');

    bump(totals, everPaid, currentlyPaying);
    if (isPaidAdChannel(channel)) {
      bump(paidAds, everPaid, currentlyPaying);
    }

    const channelCounts = byChannel.get(channel) ?? emptyCounts();
    bump(channelCounts, everPaid, currentlyPaying);
    byChannel.set(channel, channelCounts);

    const campaign = label(row.utm_campaign, '(none)');
    const source = label(row.utm_source, '(none)');
    const medium = label(row.utm_medium, '(none)');
    const campaignKey = `${channel}|${source}|${medium}|${campaign}`;
    const campaignRow = byCampaign.get(campaignKey) ?? {
      channel,
      campaign,
      source,
      medium,
      ...emptyCounts(),
    };
    bump(campaignRow, everPaid, currentlyPaying);
    byCampaign.set(campaignKey, campaignRow);
  }

  const sortBySignups = <T extends PaidConversionCounts>(a: T, b: T) =>
    b.signups - a.signups || b.everPaid - a.everPaid;

  return {
    generatedAt: now.toISOString(),
    period,
    totals: withRate(totals),
    paidAds: withRate(paidAds),
    byChannel: [...byChannel.entries()]
      .map(([channel, counts]) => ({ channel, ...withRate(counts) }))
      .sort(sortBySignups),
    byCampaign: [...byCampaign.values()]
      .map(row => ({ ...row, ...withRate(row) }))
      .sort(sortBySignups),
  };
}
