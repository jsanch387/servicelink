/** Official ServiceLink social profiles for marketing pages. */
export const MARKETING_SOCIAL = {
  tiktokHandle: 'servicelinkapp',
  tiktokUrl: 'https://www.tiktok.com/@servicelinkapp',
  instagramHandle: 'myservicelink',
  instagramUrl: 'https://instagram.com/myservicelink',
} as const;

export function tiktokEmbedUrl(videoId: string): string {
  return `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId.trim())}`;
}

export function tiktokVideoUrl(videoId: string): string {
  return `https://www.tiktok.com/@${MARKETING_SOCIAL.tiktokHandle}/video/${encodeURIComponent(videoId.trim())}`;
}

const INSTAGRAM_REEL_CODE = /instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i;

/** Shortcode from a reel, post, or TV URL. */
export function instagramReelShortcode(input: string): string {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(INSTAGRAM_REEL_CODE)?.[1];
  return fromUrl ?? trimmed.replace(/^\/+|\/+$/g, '');
}

export function instagramReelUrl(input: string): string {
  const code = instagramReelShortcode(input);
  return `https://www.instagram.com/reel/${encodeURIComponent(code)}/`;
}

export function instagramReelEmbedUrl(input: string): string {
  const code = instagramReelShortcode(input);
  return `https://www.instagram.com/reel/${encodeURIComponent(code)}/embed/?hidecaption=1`;
}
