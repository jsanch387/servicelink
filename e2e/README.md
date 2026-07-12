# End-to-end (E2E) testing

Automated browser tests that walk full user flows — login, dashboard, create/edit/delete — the same way a real user would.

**Unit tests** (`npm test` / Vitest) live next to features in `src/features/*/testing/`.  
**E2E tests** live here in `e2e/`, one folder per feature.

---

## Folder layout

```
e2e/
  README.md                 ← you are here
  fixtures/                 ← shared helpers (auth, env, booking)
  marketing/                ← marketing dashboard CRUD
  bookings/                 ← public booking + discounts
  smoke/                    ← auth smoke
```

When adding a feature: create `e2e/<feature>/README.md` + `<feature>.spec.ts`.

---

## Commands

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm run test:e2e`         | Run all E2E specs (headless — no visible browser)  |
| `npm run test:e2e:ui`      | **Playwright UI** — best for watching step-by-step |
| `npm run test:e2e:headed`  | Run with a **visible browser** window              |
| `npm run test:e2e:report`  | Open last HTML report                              |
| `npm run test:e2e:install` | Install/update Chromium for Playwright             |

---

## Setup (one time)

1. **Install browsers** (after `npm install`) — downloads Chromium into `./playwright-browsers/` in this repo:

   ```bash
   npm run test:e2e:install
   ```

   Run this once per machine (or after upgrading `@playwright/test`). If you see `Executable doesn't exist`, run this command again.

2. **Create local E2E env file** (gitignored):

   ```bash
   cp .env.e2e.example .env.e2e.local
   ```

3. Fill in `.env.e2e.local` — see [What we need from you](#what-we-need-from-you).

4. Start dev server (optional — Playwright can start it for you):

   ```bash
   npm run dev
   ```

5. Run E2E:

   ```bash
   npm run test:e2e
   ```

   Or a single suite:

   ```bash
   npm run test:e2e -- e2e/bookings/public-booking-discounts.spec.ts
   ```

---

## Environment variables

| Variable                   | Required                      | Description                                        |
| -------------------------- | ----------------------------- | -------------------------------------------------- |
| `E2E_OWNER_EMAIL`          | Yes (when running auth tests) | Login email for dedicated test account             |
| `E2E_OWNER_PASSWORD`       | Yes                           | Password for that account                          |
| `E2E_PUBLIC_BUSINESS_SLUG` | No                            | Public `/{slug}/book` slug (else resolved via API) |
| `PLAYWRIGHT_BASE_URL`      | No                            | Default `http://localhost:3000`                    |

Credentials are loaded from `.env.e2e.local` (not committed).

---

## What we need from you

Before the first real E2E run:

1. **Dedicated test business account** — not your personal prod account.
   - Email + password you’re OK putting in `.env.e2e.local`
   - Onboarding **completed** (can reach `/dashboard/marketing`)
   - Ideally **Pro** if marketing is Pro-gated when we wire that

2. **Which Supabase environment** — local dev hits your `.env.local` project (currently prod Service Link). Confirm you’re OK running create/delete tests against that DB, or tell us if you want a separate staging project later.

3. **Public booking slug** — set `E2E_PUBLIC_BUSINESS_SLUG`, or leave unset to resolve from the owner dashboard API after login.

Marketing + public booking discount specs create and delete `E2E…` promo/sale rows. Prefer a dedicated test account.

---

## Manual vs automated

- **Manual regression** — follow each feature’s `e2e/<feature>/README.md` checklist in the browser.
- **Automated** — same steps encoded in `*.spec.ts`; run on demand or in CI later.

Start manual; automate the stable happy paths first.

---

## CI (future)

Not wired yet. When ready: run `npm run test:e2e` in CI with secrets `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD` and `PLAYWRIGHT_BASE_URL` pointing at preview deploy.
