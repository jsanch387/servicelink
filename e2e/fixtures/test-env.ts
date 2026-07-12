export interface E2ETestEnv {
  baseUrl: string;
  ownerEmail: string;
  ownerPassword: string;
  /** Optional override; otherwise resolve from owner dashboard after login. */
  publicBusinessSlug: string | null;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.e2e.example to .env.e2e.local and fill in values.`
    );
  }
  return value;
}

/** Loaded from `.env.e2e.local` via Playwright config (see e2e/README.md). */
export function getE2ETestEnv(): E2ETestEnv {
  return {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://localhost:3000',
    ownerEmail: requireEnv('E2E_OWNER_EMAIL'),
    ownerPassword: requireEnv('E2E_OWNER_PASSWORD'),
    publicBusinessSlug: process.env.E2E_PUBLIC_BUSINESS_SLUG?.trim() || null,
  };
}

/** Returns false when credentials are not configured (safe for skipped suites). */
export function hasE2ECredentials(): boolean {
  return Boolean(
    process.env.E2E_OWNER_EMAIL?.trim() &&
      process.env.E2E_OWNER_PASSWORD?.trim()
  );
}
