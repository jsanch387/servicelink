import { API_ROUTES } from '@/constants/routes';
import type {
  MarketplaceSearchResponse,
  MarketplaceSearchSuccessResponse,
} from '../types/marketplace';

export async function searchMarketplace(
  location: string
): Promise<MarketplaceSearchSuccessResponse> {
  const query = new URLSearchParams({ location: location.trim() });
  const response = await fetch(
    `${API_ROUTES.MARKETPLACE_SEARCH}?${query.toString()}`
  );
  const result = (await response.json()) as MarketplaceSearchResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      !result.success ? result.error : 'Unable to search businesses right now.'
    );
  }

  return result;
}
