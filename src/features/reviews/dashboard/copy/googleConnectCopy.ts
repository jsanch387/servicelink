export const GOOGLE_CONNECT_TITLE = 'Bring your Google reviews over';

export const GOOGLE_CONNECT_LEAD =
  'You worked hard for those reviews. Connect Google and we will pull them into ServiceLink so they show on your page.';

export const GOOGLE_CONNECT_CTA = 'Connect to Google';

export const GOOGLE_CONNECT_CONNECTED_TITLE = 'Google is connected';

export const GOOGLE_CONNECT_CONNECTED_LEAD =
  'Connected. Pull your Google reviews to show them on your ServiceLink page.';

export const GOOGLE_CONNECT_PULL_CTA = 'Pull Google reviews';

export const GOOGLE_CONNECT_PULLED_LEAD = (count: number) =>
  count === 1
    ? '1 Google review is on your ServiceLink page.'
    : `${count} Google reviews are on your ServiceLink page.`;

export const GOOGLE_CONNECT_RETURN_CONNECTED =
  'Google is connected. Pull your reviews to show them on your page.';

export const GOOGLE_CONNECT_RETURN_ERROR =
  'Could not connect Google. Try again, and use the Google account that manages your listing.';
