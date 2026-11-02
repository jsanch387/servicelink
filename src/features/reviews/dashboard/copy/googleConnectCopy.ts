export const GOOGLE_CONNECT_TITLE = 'Bring your Google reviews over';

export const GOOGLE_CONNECT_LEAD =
  'Connect Google and your reviews show on your ServiceLink page.';

export const GOOGLE_CONNECT_CTA = 'Connect to Google';

export const GOOGLE_CONNECT_CONNECTED_TITLE = 'Google is connected';

export const GOOGLE_CONNECT_CONNECTED_LEAD =
  'Connected. New Google reviews show up on your page on their own.';

export const GOOGLE_CONNECT_REFRESH_CTA = 'Refresh now';

export const GOOGLE_CONNECT_PULLED_LEAD = (count: number) =>
  count === 1
    ? '1 Google review is on your ServiceLink page. New ones show up on their own.'
    : `${count} Google reviews are on your ServiceLink page. New ones show up on their own.`;

export const GOOGLE_CONNECT_RETURN_CONNECTED =
  'Google is connected. Your reviews show on your page.';

export const GOOGLE_CONNECT_RETURN_ERROR =
  'Could not connect Google. Try again, and use the Google account that manages your listing.';
