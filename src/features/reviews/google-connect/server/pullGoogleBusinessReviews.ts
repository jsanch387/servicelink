import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getGoogleAccessTokenForBusiness } from './getGoogleAccessTokenForBusiness';
import { googleReviewsParentName } from './googleReviewsParentName';
import {
  mapGoogleReviewApiRow,
  type GoogleReviewApiRow,
} from './mapGoogleReviewToPublic';
import { syncGoogleBusinessListing } from './syncGoogleBusinessListing';

const PAGE_SIZE = 50;

export type PullGoogleBusinessReviewsResult =
  | { ok: true; importedCount: number }
  | { ok: false; status: number; error: string };

async function listGoogleReviewPage(
  accessToken: string,
  parent: string,
  pageToken?: string
): Promise<
  | { ok: true; reviews: GoogleReviewApiRow[]; nextPageToken?: string }
  | { ok: false; status: number; error: string }
> {
  const url = new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`);
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Could not reach Google for reviews.',
    };
  }

  if (!response.ok) {
    console.warn('[reviews:google-connect] list reviews failed', {
      status: response.status,
    });
    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        error:
          'Google has not given this project API quota yet. That is the access request after your listing has been live 60 days.',
      };
    }
    return {
      ok: false,
      status: response.status,
      error: 'Google could not return reviews for this listing.',
    };
  }

  const json = (await response.json().catch(() => null)) as {
    reviews?: GoogleReviewApiRow[];
    nextPageToken?: string;
  } | null;

  return {
    ok: true,
    reviews: Array.isArray(json?.reviews) ? json.reviews : [],
    nextPageToken: json?.nextPageToken,
  };
}

export async function pullGoogleBusinessReviews(
  businessId: string
): Promise<PullGoogleBusinessReviewsResult> {
  const listing = await syncGoogleBusinessListing(businessId);
  if (!listing.ok) return listing;
  if (!listing.foundLocation) {
    return {
      ok: false,
      status: 404,
      error:
        'Google is connected, but no listing showed up on this account yet.',
    };
  }

  const token = await getGoogleAccessTokenForBusiness(businessId);
  if (!token.ok) return token;

  const parent = googleReviewsParentName(
    token.context.googleAccountName ?? '',
    token.context.googleLocationName ?? ''
  );
  if (!parent) {
    return {
      ok: false,
      status: 404,
      error:
        'Google is connected, but no listing showed up on this account yet.',
    };
  }

  const mapped = [];
  let pageToken: string | undefined;
  do {
    const page = await listGoogleReviewPage(
      token.context.accessToken,
      parent,
      pageToken
    );
    if (!page.ok) return page;
    for (const row of page.reviews) {
      const next = mapGoogleReviewApiRow(row);
      if (next) mapped.push(next);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  if (mapped.length > 0) {
    const { error } = await admin.from('google_reviews').upsert(
      mapped.map(review => ({
        business_id: businessId,
        provider_review_id: review.providerReviewId,
        rating: review.rating,
        body: review.body,
        author_display_name: review.authorDisplayName,
        author_photo_url: review.authorPhotoUrl,
        is_anonymous: review.isAnonymous,
        provider_create_time: review.providerCreateTime,
        provider_update_time: review.providerUpdateTime,
        owner_reply_body: review.ownerReplyBody,
        owner_replied_at: review.ownerRepliedAt,
        updated_at: now,
      })),
      { onConflict: 'business_id,provider_review_id' }
    );
    if (error) {
      console.error('[reviews:google-connect] review upsert failed', error);
      return {
        ok: false,
        status: 500,
        error: 'Google returned reviews but we could not save them.',
      };
    }
  }

  const { error: syncStampError } = await admin
    .from('google_business_connections')
    .update({ last_synced_at: now, updated_at: now })
    .eq('id', token.context.connectionId);
  if (syncStampError) {
    console.error(
      '[reviews:google-connect] last_synced_at failed',
      syncStampError
    );
  }

  return { ok: true, importedCount: mapped.length };
}
