# Workshop leads — data model & operations guide

The free ads masterclass funnel (`/workshop` → `/workshop/watch` → signup) stores **one row per email** in `public.workshop_leads`. That row is the single source of truth for:

- Who entered their email
- Which ad/campaign brought them (UTM params, `fbclid`)
- Whether they watched the video, clicked signup, and created a ServiceLink account

No Vercel Analytics Pro is required. Meta Pixel still receives custom events for ad optimization; Supabase holds first-party funnel data.

---

## Routes & APIs

| Path                           | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `/workshop`                    | Email gate (SEO landing)                             |
| `/workshop/watch`              | Gated video + conversion page (`noindex`)            |
| `/signup?from=workshop`        | Signup with workshop attribution                     |
| `POST /api/workshop/register`  | Save lead + UTMs → returns `{ leadId }`              |
| `POST /api/workshop/track`     | `{ leadId, event: 'video_view' \| 'signup_click' }`  |
| `POST /api/workshop/converted` | `{ email?, userId?, leadId? }` → sets `signed_up_at` |

**Auth:** All writes use the Supabase **service role** in API routes. RLS is enabled with **no** anon/authenticated policies.

---

## Database setup

### Option A — Migrations (recommended)

```bash
supabase db push
# or apply in order via SQL Editor:
# 1. supabase/migrations/20260521120000_workshop_leads.sql
# 2. supabase/migrations/20260521130000_workshop_leads_funnel.sql
```

### Option B — Single script (SQL Editor)

Run everything in one go:

**`supabase/scripts/workshop_leads_setup_and_upgrade.sql`**

Safe to re-run (`IF NOT EXISTS` on table and columns).

### Upgrade only (table already exists, missing funnel columns)

```sql
alter table public.workshop_leads
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists fbclid text,
  add column if not exists landing_path text,
  add column if not exists video_first_viewed_at timestamptz,
  add column if not exists video_view_count integer not null default 0,
  add column if not exists signup_first_clicked_at timestamptz,
  add column if not exists signup_click_count integer not null default 0,
  add column if not exists signed_up_at timestamptz,
  add column if not exists signed_up_user_id uuid;

create index if not exists workshop_leads_utm_campaign_idx
  on public.workshop_leads (utm_campaign)
  where utm_campaign is not null;

create index if not exists workshop_leads_signed_up_at_idx
  on public.workshop_leads (signed_up_at desc)
  where signed_up_at is not null;
```

---

## Column reference

| Column                            | Set when                       | Notes                                                |
| --------------------------------- | ------------------------------ | ---------------------------------------------------- |
| `id`                              | Email capture                  | UUID; returned to browser as `leadId`                |
| `email` / `email_normalized`      | Email capture                  | Unique on `email_normalized`                         |
| `created_at`                      | Email capture                  | Lead created                                         |
| `utm_*`, `fbclid`, `landing_path` | First landing with params      | **First-touch** — not overwritten on duplicate email |
| `video_first_viewed_at`           | First video view on watch page |                                                      |
| `video_view_count`                | Each tracked view              | Increments                                           |
| `signup_first_clicked_at`         | First signup CTA click         |                                                      |
| `signup_click_count`              | Each CTA click                 | Increments                                           |
| `signed_up_at`                    | Account created                | Matched by `leadId` and/or email                     |
| `signed_up_user_id`               | Account created                | Supabase auth user id when known                     |

---

## Funnel flow (browser → DB)

```
Meta ad URL with UTMs
    ↓
/workshop?utm_source=facebook&utm_campaign=...
    → UTMs stored in localStorage + sessionStorage (first-touch)
    ↓
Email submit → POST /api/workshop/register
    → INSERT workshop_leads (+ UTMs), leadId saved in browser
    ↓
/workshop/watch
    → POST /api/workshop/track { video_view }
    ↓
Click "Create ServiceLink" → POST /api/workshop/track { signup_click }
    → /signup?from=workshop
    ↓
Signup success → POST /api/workshop/converted
    → signed_up_at, signed_up_user_id
```

Access to the video uses `has_workshop_access` in **localStorage + sessionStorage** (Safari fallback).

---

## Meta ads — example destination URL

```
https://myservicelink.app/workshop?utm_source=facebook&utm_medium=paid&utm_campaign=detailing-masterclass-2026&utm_content=hook-a
```

Meta often appends `fbclid` automatically. Use consistent `utm_campaign` names per ad set so reporting in Supabase stays clean.

---

## Helpful SQL queries

### Recent leads (full funnel snapshot)

```sql
select
  id,
  email,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  created_at,
  video_first_viewed_at,
  video_view_count,
  signup_first_clicked_at,
  signup_click_count,
  signed_up_at
from public.workshop_leads
order by created_at desc
limit 50;
```

### Funnel counts by campaign

```sql
select
  coalesce(utm_campaign, '(no campaign)') as campaign,
  count(*) as leads,
  count(video_first_viewed_at) as watched_video,
  count(signup_first_clicked_at) as clicked_signup,
  count(signed_up_at) as signed_up
from public.workshop_leads
group by utm_campaign
order by leads desc;
```

### Conversion rate by campaign (%)

```sql
select
  coalesce(utm_campaign, '(no campaign)') as campaign,
  count(*) as leads,
  count(signed_up_at) as signups,
  round(
    100.0 * count(signed_up_at) / nullif(count(*), 0),
    1
  ) as lead_to_signup_pct,
  round(
    100.0 * count(signed_up_at) / nullif(count(video_first_viewed_at), 0),
    1
  ) as watch_to_signup_pct
from public.workshop_leads
group by utm_campaign
having count(*) > 0
order by leads desc;
```

### Leads who watched but did not sign up (retargeting list)

```sql
select email, utm_campaign, video_first_viewed_at, signup_first_clicked_at
from public.workshop_leads
where video_first_viewed_at is not null
  and signed_up_at is null
order by video_first_viewed_at desc;
```

### Leads who clicked signup but did not complete

```sql
select email, utm_campaign, signup_first_clicked_at, signup_click_count
from public.workshop_leads
where signup_first_clicked_at is not null
  and signed_up_at is null
order by signup_first_clicked_at desc;
```

### Signups today from workshop

```sql
select email, utm_campaign, signed_up_at, signed_up_user_id
from public.workshop_leads
where signed_up_at >= date_trunc('day', now() at time zone 'America/Chicago')
order by signed_up_at desc;
```

Adjust timezone as needed.

### Daily lead volume (last 30 days)

```sql
select
  date_trunc('day', created_at at time zone 'America/Chicago')::date as day,
  count(*) as new_leads,
  count(signed_up_at) as signups_same_cohort
from public.workshop_leads
where created_at >= now() - interval '30 days'
group by 1
order by 1 desc;
```

### Compare traffic sources

```sql
select
  coalesce(utm_source, '(direct / unknown)') as source,
  coalesce(utm_medium, '—') as medium,
  count(*) as leads,
  count(signed_up_at) as signups
from public.workshop_leads
group by utm_source, utm_medium
order by leads desc;
```

### Single campaign deep dive

```sql
select *
from public.workshop_leads
where utm_campaign = 'detailing-masterclass-2026'
order by created_at desc;
```

### Drop-off funnel (single numbers)

```sql
select
  count(*) as step_1_leads,
  count(video_first_viewed_at) as step_2_watched,
  count(signup_first_clicked_at) as step_3_clicked_signup,
  count(signed_up_at) as step_4_signed_up
from public.workshop_leads
where created_at >= now() - interval '7 days';
```

Add `and utm_campaign = 'your-campaign'` to filter one ad campaign.

### Export for email tool (CSV-friendly)

```sql
select
  email,
  utm_campaign,
  created_at,
  case when signed_up_at is not null then 'yes' else 'no' end as signed_up
from public.workshop_leads
where signed_up_at is null
  and video_first_viewed_at is not null
order by created_at desc;
```

---

## Matching signups to leads

- **Primary:** same email → `email_normalized` on `POST /api/workshop/converted`
- **Fallback:** browser-stored `leadId` from register response
- If a lead signs up with a **different** email than the gate, the row will not auto-link unless you merge manually

---

## Code map

| Area                  | Location                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Migrations            | `supabase/migrations/20260521120000_*.sql`, `20260521130000_*.sql`        |
| One-shot SQL          | `supabase/scripts/workshop_leads_setup_and_upgrade.sql`                   |
| Save / update lead    | `src/features/ads-workshop/server/`                                       |
| UTM capture (client)  | `utils/workshopUtmCapture.ts`                                             |
| Lead id in browser    | `utils/workshopLeadSession.ts`                                            |
| API tracking (client) | `utils/workshopLeadTracking.ts`                                           |
| Meta custom events    | `utils/workshopAnalytics.ts`                                              |
| Signup attribution    | `utils/workshopAttribution.ts`, `utils/completeWorkshopSignupTracking.ts` |

---

## Production checklist

- [ ] Migrations or `workshop_leads_setup_and_upgrade.sql` applied on production Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) set on Vercel
- [ ] Smoke test: UTM URL → email → watch → signup → `signed_up_at` populated
- [ ] Meta ad links use consistent `utm_campaign` values

---

## Privacy & compliance

- Gate copy mentions workshop updates; store emails for marketing only with appropriate consent/policy coverage.
- Do not expose `workshop_leads` to the client (no RLS read policies for anon/authenticated).
- Avoid exporting emails to third parties without consent.
