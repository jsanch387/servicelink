/**
 * Cron entry for `/api/internal/cron/quote-request-follow-ups`.
 * One owner digest per local day for requests in the follow-up window.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { QUOTE_REQUEST_FOLLOW_UP_TIMEZONE } from './constants';
import {
  groupStaleRequestsByOwner,
  loadQuoteRequestFollowUpOwners,
  loadStaleCustomerQuoteRequests,
} from './loadStaleCustomerQuoteRequests';
import { notifyOwnerForQuoteRequestFollowUp } from './notifyOwnerForQuoteRequestFollowUp';
import { quoteRequestFollowUpLocalDate } from './quoteRequestFollowUpDate';

export type QuoteRequestFollowUpsRunResult = {
  localDate: string;
  staleFound: number;
  considered: number;
  sent: number;
  duplicate: number;
  skipped: number;
  failed: number;
};

export async function runQuoteRequestFollowUps(
  supabase: SupabaseClient,
  params?: {
    now?: Date;
    timeZone?: string;
    dryRun?: boolean;
    onlyProfileId?: string | null;
  }
): Promise<QuoteRequestFollowUpsRunResult> {
  const now = params?.now ?? new Date();
  const timeZone = params?.timeZone ?? QUOTE_REQUEST_FOLLOW_UP_TIMEZONE;
  const localDate = quoteRequestFollowUpLocalDate(now, timeZone);

  const result: QuoteRequestFollowUpsRunResult = {
    localDate,
    staleFound: 0,
    considered: 0,
    sent: 0,
    duplicate: 0,
    skipped: 0,
    failed: 0,
  };

  const stale = await loadStaleCustomerQuoteRequests(supabase, now);
  if (stale === null) {
    result.failed += 1;
    return result;
  }

  result.staleFound = stale.length;
  if (stale.length === 0) return result;

  const businessToProfile = await loadQuoteRequestFollowUpOwners(
    supabase,
    stale.map(row => row.business_id)
  );
  const owners = groupStaleRequestsByOwner(stale, businessToProfile);
  const onlyProfileId = params?.onlyProfileId?.trim() || '';
  const targets = owners.filter(
    owner => !onlyProfileId || owner.profileId === onlyProfileId
  );
  result.considered = targets.length;
  result.skipped = owners.length - targets.length;

  if (params?.dryRun) return result;

  for (const owner of targets) {
    const outcome = await notifyOwnerForQuoteRequestFollowUp(supabase, {
      profileId: owner.profileId,
      count: owner.count,
      localDateYmd: localDate,
      now,
    });
    result[outcome] += 1;
  }

  return result;
}
