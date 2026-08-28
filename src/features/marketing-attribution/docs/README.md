# Marketing attribution — signup source & paid conversion

First-party measurement for **where a business owner came from** and **whether they became a paying Pro subscriber**.

No extra analytics product is required. Meta Pixel still gets `PageView`, `Lead`, `CompleteRegistration`, and `Subscribe` for Ads Manager. **This table is the source of truth** for “how many ad signups paid.”

Copy-paste queries: [`queries.sql`](./queries.sql).

---

## How it works

```
Ad / bio / blog click
  → URL has ?utm_source=&utm_medium=&utm_campaign= (and often fbclid)
  → Browser stores first-touch UTMs (localStorage)
  → User signs up
  → We write one row to public.signup_attribution (write-once)
  → User later pays for Pro
  → Stripe webhook stamps first_paid_at (write-once)
```

**First-touch:** the first real campaign that brought them wins. A later ad does not overwrite it. A weak landing (bare `/login` with no UTMs) can be upgraded when a real campaign arrives.

**One row per user.** If they already have a row, we do not insert again.

**Paying** here means **ServiceLink Pro** (our Stripe subscription), not a customer membership on a booking link.

| Metric           | Meaning                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Signup           | Row exists in `signup_attribution`                                                                                 |
| Ever paid        | `first_paid_at` is set (first time they became Stripe `active` Pro). Cancel later still counts.                    |
| Still paying     | Profile is billed Pro now (`subscription_tier = pro`, status `active` or `trialing`, has `stripe_subscription_id`) |
| Trial (not paid) | Status `trialing` does **not** set `first_paid_at` until they convert to `active`                                  |

---

## Channel labels (`signup_attribution.channel`)

Derived at signup from UTMs + landing + referrer. Prefer `channel` when asking “where did they come from?”

| Channel          | Typical cause                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `meta_ads`       | Facebook / Instagram / Meta ads (`fbclid`, `utm_source=meta` / `facebook` / `instagram` + paid medium) |
| `paid_search`    | Google ads (`gclid` or `utm_medium=cpc` that is not Meta)                                              |
| `tiktok_bio`     | TikTok bio link                                                                                        |
| `instagram_bio`  | Instagram bio (`utm_medium=bio` or `utm_campaign=bio`)                                                 |
| `social_dm`      | `utm_medium=dm`                                                                                        |
| `blog` / `site`  | In-product CTAs we tag ourselves                                                                       |
| `workshop`       | Ads masterclass funnel                                                                                 |
| `organic_google` | Google referrer, no paid tag                                                                           |
| `direct`         | Landed on `/` with no referrer and no UTMs                                                             |
| `unknown`        | Something we could not classify                                                                        |

---

## How to start tracking (ads + ship)

Tracking is already in the app. You do **not** buy another product. You need:

1. **This SQL already ran** — `first_paid_at` exists (you did this).
2. **Ship the app code** that stamps `first_paid_at` on the Stripe webhook and serves the report. Until that deploy is live, new Pro checkouts will not stamp going forward (backfill already covered people who had already paid).
3. **Tag every ad URL** with UTMs. Meta often appends `fbclid` even without UTMs, and we treat `fbclid` as `meta_ads`, but campaign-level reporting needs `utm_campaign`.

### Recommended Meta / Instagram / Facebook ad URL

Use your real landing page (homepage, `/workshop`, `/pricing`, etc.):

```
https://myservicelink.app/?utm_source=meta&utm_medium=paid&utm_campaign=YOUR_CAMPAIGN_NAME&utm_content=YOUR_AD_NAME
```

| Param          | Use                                  | Example               |
| -------------- | ------------------------------------ | --------------------- |
| `utm_source`   | `meta` (or `facebook` / `instagram`) | `meta`                |
| `utm_medium`   | `paid` (or `cpc` / `ig`)             | `paid`                |
| `utm_campaign` | Campaign name you will filter on     | `pro-prospecting-aug` |
| `utm_content`  | Optional ad/creative name            | `hook-a`              |

Do **not** use `utm_medium=bio` on paid ads — that classifies as Instagram bio, not ads.

In Ads Manager you can use **URL parameters** so every ad gets these automatically:

```
utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

Same pattern for TikTok bios (`utm_source=tiktok&utm_medium=bio&utm_campaign=bio`) and any other channel.

---

## Where to read the numbers

### In the app (founder only)

`/dashboard/internal/acquisition`

Allowed for emails in `src/features/marketing-attribution/config/internalAnalyticsAllowlist.ts` (plus optional env `INTERNAL_ANALYTICS_EMAILS`). Not in the dashboard nav.

### In Supabase (any time)

Open **SQL Editor** and run [`queries.sql`](./queries.sql).

Start with:

1. **Where signups came from** — `by_channel`
2. **Ad → paid** — `meta_ads_paid_conversion`
3. **Which campaign** — `by_campaign`

---

## Tables

### `public.signup_attribution`

| Column           | Set when       | Notes                               |
| ---------------- | -------------- | ----------------------------------- |
| `user_id`        | Signup         | Primary key / one row per user      |
| `utm_*`          | Signup         | First-touch campaign fields         |
| `fbclid`/`gclid` | Signup         | Click ids when present              |
| `landing_path`   | Signup         | First marketing landing             |
| `referrer`       | Signup         | Document referrer when useful       |
| `channel`        | Signup         | Derived label (see above)           |
| `signed_up_at`   | Signup         | When we recorded attribution        |
| `first_paid_at`  | First paid Pro | Write-once; null if they never paid |

Writes use the **service role**. Users cannot edit their own attribution.

### `public.profiles` (joined for “still paying”)

`subscription_tier`, `subscription_status`, `stripe_subscription_id`, `stripe_customer_id`.

---

## Code map

| Piece                       | Path                                                               |
| --------------------------- | ------------------------------------------------------------------ |
| Capture UTMs in the browser | `utils/utmCapture.ts`                                              |
| Channel rules               | `utils/deriveSignupChannel.ts`                                     |
| Save on signup              | `POST /api/attribution/signup` → `server/saveSignupAttribution.ts` |
| Stamp first paid            | Stripe webhook → `server/markSignupAttributionFirstPaid.ts`        |
| Report                      | `server/loadPaidConversionReport.ts`                               |
| Founder page                | `/dashboard/internal/acquisition`                                  |
| Schema                      | `docs/migrations/001_signup_attribution_first_paid_at.sql`         |
