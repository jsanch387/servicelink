# Stripe Connect onboarding – planned behavior

This document plans how **ServiceLink** and **Supabase** stay in sync from the moment an owner clicks **Connect with Stripe** through successful onboarding. It complements **`DATABASE.md`** (table definitions).

**Status:** planning only. Implement in small steps: persist account → resume links → return sync → webhooks.

---

## Plain language: what the owner actually does

1. In ServiceLink they tap **Connect with Stripe** (or similar).
2. The browser **redirects to Stripe’s website**. Stripe shows the hosted onboarding forms (business details, bank, identity, etc.). That is **not** our UI; we do not save each field they type as they type.
3. They might **finish everything** in one sitting, or **stop halfway** (close the tab, lose connection, come back days later).
4. When Stripe is done **for that visit**, Stripe sends them **back to ServiceLink** using the **`return_url`** we configured when we created the link. That “back to our app” moment is what we mean by **on return**: our server or page runs, we ask Stripe “what’s the status of this account now?”, and we update our database so the dashboard matches reality.
5. If they are **fully ready to charge** (per Stripe’s flags and our rules), we show the **real Payments** experience: deposits, checkout mode, etc. That is when **`payment_settings`** first gets a row (we do **not** create it when someone only creates a business profile).

### Glossary (terms that sound alike but are different)

| Term                               | What it is                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe Connect account**         | The **merchant account** Stripe created for this business, identified by **`acct_…`**. Think: “their Stripe business.” It persists whether onboarding is half-done or done.                                                                                                   |
| **`payment_accounts` (our table)** | **Our** row that says “this `business_id` is linked to **`stripe_account_id` `acct_…`**” plus flags we copy from Stripe (`charges_enabled`, onboarding state, etc.). One row per business.                                                                                    |
| **Account Link**                   | A **temporary URL** Stripe gives us that **opens the onboarding wizard** for **one** `acct_…`. It **expires**. If they need to continue later, we ask Stripe for a **new** Account Link for the **same** `acct_…`—we do **not** need a brand-new merchant account every time. |
| **Reuse `stripe_account_id`**      | On the **second** click of Connect, we **do not** call “create a new Stripe account” again. We read the id we already saved, mint a **new Account Link**, and send them to Stripe again. Same locker, new key.                                                                |
| **`return_url`**                   | URL on **our** domain Stripe redirects to after onboarding **for that session** ends (finished or “I’m done for now”). **On return** = we handle that request and sync DB.                                                                                                    |
| **`refresh_url`**                  | If the **Account Link session** expired while they were on Stripe, Stripe can send them here so **our** app can issue a **fresh** Account Link (still same `acct_…`).                                                                                                         |

---

## What Stripe already guarantees

- **One Connect account** (`acct_…`) can go through onboarding in multiple sessions.
- If the user **abandons** onboarding or the **Account Link expires**, Stripe provides **`refresh_url`** so the app can mint a **new Account Link** for the **same** `acct_…` (resume), not necessarily create a brand-new account every time.

So “user exited halfway” does **not** automatically mean “start from zero in Stripe” if we **persist** `stripe_account_id` early.

---

## Recommended UX / data rules

### 1) First click: “Connect with Stripe”

**Goal:** Create (or reuse) exactly **one** Stripe Connect account per `business_id`, persist it immediately, then open onboarding.

| Step                                       | Stripe                                       | Our DB (`payment_accounts`)                                                                                                   |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Ensure row exists                          | —                                            | Upsert row for `business_id` if missing.                                                                                      |
| Create account (if no `stripe_account_id`) | `accounts.create` (Express)                  | Set `stripe_account_id`, set `onboarding_status = 'in_progress'`, clear or set booleans from initial retrieve if you call it. |
| Create link                                | `accountLinks.create` (`account_onboarding`) | Optionally set `last_synced_at` after link creation (optional).                                                               |

**Important:** Avoid creating a **new** `acct_…` on every click once a row exists. Reuse `stripe_account_id` and only create a **new Account Link**.

### 2) User is on Stripe’s hosted onboarding

No ServiceLink DB updates are required **during** their typing on Stripe’s site. Updates happen when:

- They hit **`return_url`** (back to ServiceLink), and/or
- Stripe sends **webhooks** (account / capability / requirements updated).

### 3) User exits early (closes tab, abandons flow)

**Stripe side:** The account may exist in `pending` / `restricted` / incomplete requirements states.

**Our side (simple v1):**

- Keep the same `payment_accounts` row and `stripe_account_id`.
- Keep `onboarding_status` as `in_progress` (or map from Stripe fields on next sync).
- Next time they click Connect: **create a new Account Link** for the **same** `stripe_account_id` (resume).

That is a good balance of **simplicity** and **UX**: they never “lose” their account id; they just continue.

### 4) User completes onboarding

On **`return_url`** load (and/or webhook):

1. `accounts.retrieve(stripe_account_id)` (include requirements if needed).
2. Map Stripe fields → DB:
   - `charges_enabled`, `payouts_enabled`, `details_submitted`
   - `onboarding_status`: e.g. `complete` when ready to charge per your product rules; `restricted` if Stripe indicates restrictions.
   - `requirements_status` (optional string snapshot)
   - `connected_at` set once when first considered connected (if null)
   - `last_synced_at = now()`

3. UI: if “ready”, show **real payments dashboard**; else show **setup / action required** with CTA to open a fresh Account Link.

### 5) `refresh_url`

When Stripe says the onboarding session expired, user lands on `refresh_url`. Plan:

- Same as “resume”: create a **new Account Link** (no new `acct_…`).

---

## `payment_settings` lifecycle (v1)

**Decision:** Do **not** create a `payment_settings` row when a business profile is created. Many users never go Pro or use payments; that would add useless rows.

**When to create it:** The first row is created when the owner taps **Turn on ServiceLink payments** (POST `/api/payments/servicelink/enable`) after Stripe Connect is **complete**. Defaults fill checkout/deposit columns; `payments_enabled` is set **true**. Until then, only **`payment_accounts`** is required (Connect UI → then the ServiceLink gate UI).

---

## Webhooks (later but recommended)

Return URL sync gives **fast UX**. Webhooks give **truth over time** (requirements can change after onboarding).

Plan to handle (names depend on Stripe API version / Connect type):

- Account updated / requirements updated
- Capability updates (card payments, etc.)

Update the same `payment_accounts` columns and `last_synced_at`. Use **idempotent** processing (you already have `stripe_webhook_events` for subscription flows; extend or add a parallel path for Connect).

---

## What we are explicitly **not** doing in this planning slice

- No `payment_transactions` table in v1 (Stripe Dashboard for history).
- No in-app ledger until product is ready.

---

## Implementation order (suggested)

1. On “Connect”: upsert `payment_accounts`, reuse `stripe_account_id`, create Account Link.
2. On return: `accounts.retrieve` → update `payment_accounts` → drive UI.
3. Add `refresh_url` handler path (same as resume link).
4. Add Connect webhooks + idempotency.
5. **`payment_settings`** row is created when the owner enables ServiceLink payments (not at business creation).

This keeps each step small and reviewable.
