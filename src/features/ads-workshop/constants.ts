/** Browser flag set after email capture or for returning visitors. */
export const HAS_WORKSHOP_ACCESS_STORAGE_KEY = 'has_workshop_access';

export const HAS_WORKSHOP_ACCESS_STORAGE_VALUE = 'true';

/** Set when user enters the workshop funnel — used for signup attribution. */
export const WORKSHOP_ATTRIBUTION_STORAGE_KEY = 'sl_workshop_attribution';

/** Persisted after email capture — used for funnel updates without re-entering email. */
export const WORKSHOP_LEAD_ID_STORAGE_KEY = 'workshop_lead_id';

/** First-touch UTM payload from landing URL (survives gate → watch). */
export const WORKSHOP_UTM_STORAGE_KEY = 'workshop_utm_attribution';

/** Official workshop embed (YouTube). */
export const WORKSHOP_YOUTUBE_EMBED_SRC =
  'https://www.youtube.com/embed/mebEkfFUBlI?rel=0&modestbranding=1';

export const ADS_WORKSHOP_VIDEO = {
  title: 'How to Run Local Ads That Fill Your Calendar',
  description:
    'One complete walkthrough: local Meta targeting, video creatives, and sending ad traffic to a booking link instead of DMs.',
  durationLabel: '20 min',
} as const;
