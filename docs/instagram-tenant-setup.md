# Instagram DM agent — Step 1 tenant wiring

Every webhook must resolve **which ServiceLink business** owns the Instagram inbox before we load services, availability, or bookings.

## What you need to provide (two values)

### 1. `INSTAGRAM_MESSAGING_BUSINESS_ID`

Your row in **`business_profiles.id`** (UUID), not `profile_id` and not `public_id`.

**How to find it:**

- **Supabase:** Table Editor → `business_profiles` → copy `id` for your shop.
- **SQL:** `select id, business_name, business_slug from business_profiles where business_name ilike '%your shop%';`

### 2. `INSTAGRAM_MESSAGING_ACCOUNT_ID` (recommended)

Instagram professional account id from Meta webhooks: **`entry[0].id`** in the POST body.

**How to find it:**

- Send a test DM and read the dev terminal line:
  `🏢 [tenant] business_id=... instagram_account_id=XXXXXXXX`
- Or from an earlier log when your **business** sent/received an echo — sender `17841450647412386` style ids are often the IG account id (confirm against `entry[0].id` in a logged payload).

Add to `.env.local`:

```env
INSTAGRAM_MESSAGING_BUSINESS_ID=00000000-0000-0000-0000-000000000000
INSTAGRAM_MESSAGING_ACCOUNT_ID=17841450647412386
```

Restart `npm run dev` after saving.

## Done when

- A test DM logs: `🏢 [tenant] business_id=<your uuid> instagram_account_id=<ig id>`
- No `Tenant resolution failed` errors

## Conversation memory (Step 3)

Table: `instagram_dm_conversations` — one row per `(business_id, instagram_sender_id)`.

Webhook loads state before AI, merges fields after each turn, and upserts the row. Logs show `conversationStage`, `collected`, and `bookingId` when created.

**Required migration for full in-chat booking:** run `docs/instagram-dm-conversations-migration.sql` in Supabase (customer/address columns + `booking_id` + stage values `collecting_customer` / `booked`).

### Stage check constraint (required migration)

If saves fail with `violates check constraint "instagram_dm_conversations_stage_check"`, the table was created before the **confirm-before-book** stage. Run in Supabase SQL Editor:

```sql
ALTER TABLE instagram_dm_conversations
  DROP CONSTRAINT IF EXISTS instagram_dm_conversations_stage_check;

ALTER TABLE instagram_dm_conversations
  ADD CONSTRAINT instagram_dm_conversations_stage_check
  CHECK (stage IN (
    'greeting',
    'qualifying',
    'offering',
    'awaiting_confirmation',
    'ready_to_book'
  ));
```

Allowed stages: `greeting`, `qualifying`, `offering`, `awaiting_confirmation` (summary sent, waiting for YES), `ready_to_book` (customer confirmed).

### New booking vs same thread

Saved state is keyed by `(business_id, instagram_sender_id)` — it does **not** reset when the customer opens a new Instagram chat. The app clears the row when:

- They send a **fresh outreach** message (e.g. “what are your prices”, “saw your post”) while an old booking was pending or complete in DB
- They were **idle 48+ hours** (`updated_at` on the row) and message again
- They say **start over** / **new appointment** / similar
- A prior thread had **`booking_confirmed`** in notes and they ask pricing again

Mid-booking replies (`yes`, `9am`, `Friday`, `change to…`) keep the existing row.

For local testing, delete the row in Table Editor or:

```sql
DELETE FROM instagram_dm_conversations
WHERE business_id = 'YOUR_BUSINESS_UUID'
  AND instagram_sender_id = 'YOUR_IG_SENDER_ID';
```

## Booking link (Step 2b)

The agent loads `business_link` / `business_slug` and normalizes to `https://myservicelink.app/{slug}`. It is included in replies for menu/pricing, booking, and payment questions — never invented by the model.

## Later (dashboard connect)

- Table `instagram_messaging_channels` — run [docs/instagram-messaging-channels-migration.sql](./instagram-messaging-channels-migration.sql)
- Owner connects IG in **Automation** (Facebook OAuth), no manual UUID copy
