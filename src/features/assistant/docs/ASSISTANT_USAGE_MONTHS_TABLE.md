# `assistant_usage_months`

Monthly meter for Assistant outbound texts. **Limit is not stored here** — beta cap lives in app config (`ASSISTANT_BETA_TEXT_LIMIT = 30`).

**Migration:** [`migrations/002_assistant_usage_months.sql`](./migrations/002_assistant_usage_months.sql)

---

## Columns

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `business_id` | `uuid` | NO | — | PK part; FK → `business_profiles(id)` ON DELETE CASCADE |
| `year_month` | `text` | NO | — | PK part; UTC calendar month `YYYY-MM` |
| `text_sent_count` | `integer` | NO | `0` | Successful Assistant texts this month; `>= 0` |
| `created_at` | `timestamptz` | NO | `now()` | Row create |
| `updated_at` | `timestamptz` | NO | `now()` | Updated on each reserve |

**Checks**

- `year_month ~ '^\d{4}-(0[1-9]|1[0-2])$'`
- `text_sent_count >= 0`

---

## Indexes

| Name | Definition |
| --- | --- |
| `assistant_usage_months_pkey` | PRIMARY KEY (`business_id`, `year_month`) |
| `assistant_usage_months_business_id_idx` | (`business_id`) |

---

## How the app uses rows

| Helper | Behavior |
| --- | --- |
| `getAssistantTextUsage` | Read count for current UTC month; `remaining = max(0, limit - sent)` |
| `reserveAssistantTextUsage(n)` | Upsert `text_sent_count = sent + n` if under limit |
| `releaseAssistantTextUsage(n)` | Best-effort decrement (rollback helper; Send path prefers not to reserve before SMS) |

**v1 Send path:** increment **+1 per delivered item** after a new `assistant_actions` `sent` row is created — never for failed SMS, opt-out, or missing phone.

UI pill: “`{sent}` of `{limit}` texts this month”.

---

## RLS

- **SELECT:** owner or active manager.
- **INSERT / UPDATE / DELETE:** service role only.
