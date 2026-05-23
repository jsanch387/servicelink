export type WorkshopUtmAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  landingPath?: string;
};

export type WorkshopFunnelEvent = 'video_view' | 'signup_click';
