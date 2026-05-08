/**
 * Stripe `accountLinks.create` only accepts certain redirect URLs.
 * Custom URI schemes (e.g. `myapp://…`) return `url_invalid` on `return_url` / `refresh_url`.
 */

function normalizeEnvRedirectUrl(value: string): string {
  let s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export type ValidateConnectAccountLinkUrlResult =
  | { ok: true; href: string }
  | { ok: false; message: string };

/**
 * @param raw Value from env (may include accidental wrapping quotes).
 * @param envVarName For user-facing error messages only.
 */
export function validateConnectAccountLinkUrl(
  raw: string,
  envVarName: string
): ValidateConnectAccountLinkUrlResult {
  const s = normalizeEnvRedirectUrl(raw);
  if (!s) {
    return {
      ok: false,
      message: `${envVarName} is empty after trimming.`,
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(s);
  } catch {
    return {
      ok: false,
      message: `${envVarName} must be a full absolute URL (e.g. https://yourdomain.com/connect/return). Check for typos, spaces, or missing scheme.`,
    };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      message: `${envVarName} must start with http:// or https://. Stripe rejects custom URL schemes for Connect Account Links — use an https page (or localhost http in dev) that redirects into your app.`,
    };
  }
  return { ok: true, href: parsed.toString() };
}
