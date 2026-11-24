/** Put the real review URL into an Assistant draft body. */
export function injectReviewUrlIntoBody(body: string, url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return body;

  if (body.includes('[review link]')) {
    return body.split('[review link]').join(trimmedUrl);
  }

  // Owner already pasted a review URL — leave their edit alone.
  if (/\/review\/[A-Za-z0-9_-]+/.test(body)) {
    return body;
  }

  return `${body.trim()} ${trimmedUrl}`.trim();
}
