export interface MarketplaceServiceSummary {
  id: string;
  name: string;
  priceCents: number;
}

export interface MarketplaceBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  serviceArea: string;
  locationMode: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  services: MarketplaceServiceSummary[];
  rating: number | null;
  reviewCount: number;
}

export interface MarketplaceSearchSuccessResponse {
  success: true;
  location: string;
  businesses: MarketplaceBusiness[];
}

export type MarketplaceSearchResponse =
  | MarketplaceSearchSuccessResponse
  | {
      success: false;
      error: string;
    };
