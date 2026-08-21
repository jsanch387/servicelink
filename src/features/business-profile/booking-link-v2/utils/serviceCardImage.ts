import { MARKETING_IMAGES } from '@/constants/marketingImages';

export const BOOKING_LINK_V2_MOCK_SERVICE_IMAGES = [
  MARKETING_IMAGES.marketplace.exterior,
  MARKETING_IMAGES.marketplace.interiorOne,
  MARKETING_IMAGES.marketplace.ceramic,
  MARKETING_IMAGES.marketplace.interiorTwo,
  MARKETING_IMAGES.marketplace.boat,
] as const;

export function getBookingLinkV2MockServiceImage(serviceId?: string): string {
  const id = serviceId ?? '';
  if (!id) return BOOKING_LINK_V2_MOCK_SERVICE_IMAGES[0];

  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % BOOKING_LINK_V2_MOCK_SERVICE_IMAGES.length;

  return BOOKING_LINK_V2_MOCK_SERVICE_IMAGES[index];
}
