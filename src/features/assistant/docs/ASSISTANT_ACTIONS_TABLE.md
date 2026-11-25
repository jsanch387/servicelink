# `assistant_actions`

Append-only decision log for Owner Assistant. Used to **suppress** due cards after Skip/Send and to feed activity-style history.

**Migration:** [`migrations/001_assistant_actions.sql`](./migrations/001_assistant_actions.sql)

---

## Columns

| Column           | Type          | Null | Default             | Notes                                                                                 |
| ---------------- | ------------- | ---- | ------------------- | ------------------------------------------------------------------------------------- |
| `id`             | `uuid`        | NO   | `gen_random_uuid()` | PK                                                                                    |
| `business_id`    | `uuid`        | NO   | —                   | FK → `business_profiles(id)` ON DELETE CASCADE                                        |
| `customer_id`    | `uuid`        | YES  | —                   | FK → `customers(id)` ON DELETE SET NULL                                               |
| `booking_id`     | `uuid`        | YES  | —                   | FK → `bookings(id)` ON DELETE SET NULL; last visit when known                         |
| `sms_message_id` | `uuid`        | YES  | —                   | FK → `sms_messages(id)` ON DELETE SET NULL; set on successful Send                    |
| `actor`          | `text`        | NO   | —                   | App uses `owner` (also reserved: `assistant`, `system`)                               |
| `actor_user_id`  | `uuid`        | YES  | —                   | Auth user who approved Skip/Send                                                      |
| `kind`           | `text`        | NO   | —                   | `skipped` \| `unskipped` \| `sent`                                                    |
| `subject`        | `text`        | NO   | —                   | v1: `review_followup` \| `rebook_checkin` (builders also know quote/invoice subjects) |
| `dedupe_key`     | `text`        | NO   | —                   | Unique per business; idempotency                                                      |
| `payload`        | `jsonb`       | NO   | `{}`                | e.g. `{ "body": "…" }` on send                                                        |
| `created_at`     | `timestamptz` | NO   | `now()`             | Ordering for “latest decision”                                                        |

---

## Indexes

| Name                                             | Definition                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `assistant_actions_pkey`                         | PRIMARY KEY (`id`)                                                                           |
| `assistant_actions_business_dedupe_key`          | UNIQUE (`business_id`, `dedupe_key`)                                                         |
| `assistant_actions_business_created_at_idx`      | (`business_id`, `created_at` DESC)                                                           |
| `assistant_actions_latest_decision_idx`          | (`business_id`, `customer_id`, `subject`, `created_at` DESC) WHERE `customer_id` IS NOT NULL |
| `assistant_actions_business_sent_created_at_idx` | (`business_id`, `created_at` DESC) WHERE `kind = 'sent'`                                     |

---

## Dedupe key shapes (app)

| Kind | Key                                                   |
| ---- | ----------------------------------------------------- |
| Send | `sent:{customerId}:{subject}:{YYYY-MM-DD}` (UTC date) |
| Skip | `skipped:{customerId}:{subject}:{ISO timestamp}`      |

Same-day Send retries that hit unique violation are treated as already recorded (`created: false`) and **do not** burn quota again.

---

## How the app uses rows

- **Suppression:** latest `kind` per `(customer_id, subject)` among decision kinds — see [FLOWS.md](./FLOWS.md).
- **Activity:** mapped into Assistant activity entries on today build.
- **Support:** join `sms_message_id` → `sms_messages` for delivery status / Telnyx id.

---

## RLS

- **SELECT:** business owner (`business_profiles.profile_id = auth.uid()`) or active `manager` member.
- **INSERT / UPDATE / DELETE:** not granted to `authenticated`; use service role.
