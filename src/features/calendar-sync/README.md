# Calendar sync (ICS subscription feed)

Owners can add **confirmed** (and **cancelled**) availability bookings to their **phone calendar** by subscribing to a **private URL** that always returns an up-to-date **calendar file** (ICS format).

This is **not** Google Calendar OAuth and **not** a native “write to Calendar” API. It is the same pattern many apps use: a **subscribe-by-URL** feed.

---

## Plain English: how new appointments show up

1. **You subscribe once**  
   Your calendar app (Apple, Google, etc.) saves the subscription **link** we give you—like saving a bookmark.

2. **The app checks that link again later**  
   On a schedule **only the calendar app controls** (often minutes, sometimes longer), it does the same thing as opening a webpage: **“GET this URL again.”**

3. **Our server answers with a fresh file every time**  
   When that request hits **`/api/calendar/feed/[token]`**, we **do not** return a cached copy from when you first subscribed. We **look at the database right then**, build a **new** `.ics` file from **current** bookings, and return it.

4. **Your calendar merges by event ID**  
   Each booking has a stable **`UID`** in the file. When the new file includes a **new** `UID`, the app **adds** an event. When an existing booking **changes**, the same `UID` appears with updated times. When a booking is **cancelled**, we still emit that `UID` with **`STATUS:CANCELLED`** so the app can **remove** it.

So: **nothing pushes from our app to your phone.** Your phone **pulls** the link on its own timer. **“Knowing” about a new appointment** = the **next time** it pulls, our server **includes** that row because it’s already in **`bookings`**.

---

## What lives in this feature

| Area | Role |
|------|------|
| `server/calendarFeedSecret.ts` | Signing secret (`CALENDAR_FEED_SECRET` or derived from Supabase service key). |
| `server/calendarFeedToken.ts` | HMAC token `{businessId}.{sig}`; verifies public feed requests. |
| `server/buildBookingsIcs.ts` | Builds RFC 5545 ICS text (`VEVENT`, `UID`, `DTSTART`/`DTEND`, etc.). |
| `services/listBookingsForCalendarFeed.ts` | Loads `confirmed` + `cancelled` rows for a business (service role on feed route). |
| `components/SyncBookingsCtaCard.tsx` | Bookings header CTA. |
| `components/SyncBookingsConfirmModal.tsx` | Explain → confirm (Pro) or Upgrade to Pro (free) → open subscribe URL / close. |
| `testing/*.test.ts` | Token + ICS helpers. |

---

## API routes (see `src/constants/routes.ts` → `API_ROUTES`)

| Route | Who | What |
|-------|-----|------|
| `GET /api/calendar/feed/link` | Logged-in owner | Returns `httpsUrl` + `webcalUrl` for **their** business (session). |
| `GET /api/calendar/feed/[token]` | Public (signed token) | Returns `text/calendar` ICS for that business. Calendar servers call this **without** logging into ServiceLink. |

The **token** is a **bearer secret**: anyone with the full URL can read that feed. Treat it like an unlisted link.

---

## Security notes (short)

- Feed URL is **signed**; random URLs should not work for other businesses.
- Prefer **`CALENDAR_FEED_SECRET`** (see next section) so calendar URLs are **not** tied to your Supabase service role key.
- **Rate limiting** is applied on both calendar API routes (see `src/server/rateLimit/README.md` for limits and env vars). Production should set **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`** so limits are shared across serverless instances.

---

## `CALENDAR_FEED_SECRET` (recommended for production)

**Why:** The feed token is an HMAC of `businessId` using a server-only secret. If that secret is **only** `CALENDAR_FEED_SECRET`, you can:

- Rotate the **Supabase service key** without breaking every owner’s subscribed calendar.
- Rotate **only** the calendar secret if you ever need to invalidate all feed URLs (owners re-subscribe once).

**If unset:** We derive a stable secret from `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` (see `server/calendarFeedSecret.ts`). That works, but ties calendar links to that key.

### How to set it

1. **Generate a long random value** (at least 32 bytes of randomness), for example:

   ```bash
   openssl rand -hex 32
   ```

2. **Add it as a server environment variable** (must **not** use the `NEXT_PUBLIC_` prefix—this must never ship to the browser):

   - **Vercel (or similar):** Project → Settings → Environment Variables → name `CALENDAR_FEED_SECRET`, paste the value. Enable it for **Production** (required for real users). Add it to **Preview** too if anyone tests calendar subscribe on preview URLs. **Redeploy** after saving so serverless functions pick it up.
   - **Local:** Add to `.env.local` (keep this file **gitignored**; never commit the value):

     ```bash
     CALENDAR_FEED_SECRET=paste_the_hex_string_here
     ```

3. **Restart or redeploy:** After changing `.env.local`, **restart** `next dev`. After changing Vercel envs, **redeploy** the project.

**Operational hygiene:** Do not paste `CALENDAR_FEED_SECRET` into tickets, screenshots, or chat logs.

### Ops / troubleshooting: when subscribed calendars “break”

**If the signing secret changes, every owner’s existing subscription link stops working** until they run **Add to calendar** again and subscribe with the new URL. The calendar app keeps using the **old** URL; our server will reject it (bad signature) or it will no longer match what we sign—either way, **re-subscribe is required**.

This applies when:

- **`CALENDAR_FEED_SECRET`** is set, changed, cleared, or pasted wrong after a deploy.
- **`CALENDAR_FEED_SECRET` is unset** and **`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`** is rotated (derived signing input changed, so all tokens change).

**When debugging later (“calendar sync used to work”):** ask first: *Did `CALENDAR_FEED_SECRET` or the Supabase service key change? Did someone redeploy with different env vars?* That rules out a whole class of issues before digging into app bugs.

### When you change or remove it

- **Changing** `CALENDAR_FEED_SECRET` **invalidates every existing feed URL** until owners run **Add to calendar** again and re-subscribe (same as rotating the signing key on purpose).
- **Removing** it (so only Supabase key is used again) also changes how the secret is derived → **all URLs change** relative to the dedicated-secret era.

---

## Limitations / product expectations

- **Refresh delay**: New bookings appear after the **next** fetch from the calendar app—not necessarily instant.
- **Time**: Bookings are stored as **local wall date + time**; the ICS uses **floating** date-times (no `TZID`). Fine for many single-timezone businesses; multi-region or strict TZ needs a future design.
- **Completed** bookings are **not** included today (only `confirmed` + `cancelled` for the feed logic we ship).
- **Re-subscribe** if the subscription is removed, the URL changes, or the signing secret is rotated (see **Ops / troubleshooting** above).

---

## Testing

Vitest specs live under **`testing/`** (see repo `vitest.config.ts` include pattern).

| File | What it covers |
|------|------------------|
| `testing/calendarFeedSecret.test.ts` | `CALENDAR_FEED_SECRET` wins over Supabase keys; stable derivation from service role; key priority; throws when nothing is configured. |
| `testing/calendarFeedToken.test.ts` | Sign + verify token round-trip; invalid tokens rejected. |
| `testing/buildBookingsIcs.test.ts` | ICS escaping / folding; address formatting; full `buildBookingsIcs` output for confirmed + cancelled events; escaped `LOCATION`. |

Run this feature’s tests:

```bash
npm run test -- src/features/calendar-sync/testing
```

API route handlers (`/api/calendar/feed/...`) are thin wrappers around the above; integration tests against a real Supabase instance are optional follow-up.

---

## Related code elsewhere

- Bookings UI: `src/features/availability/booking/dashboard/AvailabilityBookingsView.tsx`
- Raw bookings table: `src/features/availability/docs/BOOKINGS_TABLE.md`
