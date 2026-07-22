import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { searchMarketplaceBusinesses } from '@/features/marketplace/server/searchMarketplaceBusinesses';
import type { MarketplaceSearchResponse } from '@/features/marketplace/types/marketplace';
import { assertPublicMarketplaceSearchRateLimit } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isMarketplacePublicEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Not found',
      } satisfies MarketplaceSearchResponse,
      { status: 404 }
    );
  }

  const rateLimited = await assertPublicMarketplaceSearchRateLimit(request);
  if (rateLimited) return rateLimited;

  const location = request.nextUrl.searchParams.get('location') ?? '';

  try {
    const result = await searchMarketplaceBusinesses(location);
    return NextResponse.json(
      {
        success: true,
        location: result.location,
        businesses: result.businesses,
      } satisfies MarketplaceSearchResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to search businesses right now.';
    const isValidation = message.startsWith('Enter a city');

    if (!isValidation) {
      console.error('[marketplace] search failed', error);
    }

    return NextResponse.json(
      {
        success: false,
        error: isValidation
          ? message
          : 'Unable to search businesses right now.',
      } satisfies MarketplaceSearchResponse,
      { status: isValidation ? 400 : 500 }
    );
  }
}
