/** localStorage key — client-only gate until email capture is wired up. */
export const ADS_WORKSHOP_ACCESS_STORAGE_KEY =
  'servicelink:ads-workshop-access';

/** Single on-demand workshop video — set `youtubeUrl` when the recording is ready. */
export const ADS_WORKSHOP_VIDEO = {
  title: 'How to Run Local Ads That Fill Your Calendar',
  description:
    'One complete walkthrough: local Meta targeting, video creatives, and sending ad traffic to a booking link instead of DMs.',
  durationLabel: '15 min',
  /** YouTube watch or embed URL; null shows a coming-soon placeholder. */
  youtubeUrl: null as string | null,
} as const;
