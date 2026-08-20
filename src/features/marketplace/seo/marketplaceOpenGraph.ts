import { MARKETING_IMAGES } from '@/constants/marketingImages';

/** Facebook / iMessage / Twitter large-card image for find-detailers pages. */
export const MARKETPLACE_OG_IMAGE = {
  url: MARKETING_IMAGES.marketplace.openGraph,
  width: 1200,
  height: 630,
  alt: 'Find a detailer near you on ServiceLink',
  type: 'image/png' as const,
};
