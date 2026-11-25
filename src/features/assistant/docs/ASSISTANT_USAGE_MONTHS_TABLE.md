# `assistant_usage_months`

Monthly meter for Assistant outbound texts **and** Ask chat turns. **Limits are not stored here** — beta caps live in app config (`ASSISTANT_BETA_TEXT_LIMIT`, `ASSISTANT_BETA_CHAT_TURN_LIMIT`).

**Migrations:** [`002_assistant_usage_months.sql`](./migrations/002_assistant_usage_months.sql), [`004_assistant_chat_turns.sql`](./migrations/004_assistant_chat_turns.sql)

---

## Columns

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `business_id` | `uuid` | NO | — | PK part; FK → `business_profiles(id)` ON DELETE CASCADE |
| `year_month` | `text` | NO | — | PK part; UTC calendar month `YYYY-MM` |
| `text_sent_count` | `integer` | NO | `0` | Successful Assistant texts this month; `>= 0` |
| `chat_turn_count` | `integer` | NO | `0` | Ask chat turns this month (1 per owner question); `>= 0` |
| `created_at` | `timestamptz` | NO | `now()` | Row create |
| `updated_at` | `timestamptz` | NO | `now()` | Updated on each reserve |

**Checks**

- `year_month ~ '^\d{4}-(0[1-9]|1[0-2])$'`
- `text_sent_count >= 0`
- `chat_turn_count >= 0`

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
| `getAssistantTextUsage` | Read text count for current UTC month; `remaining = max(0, limit - sent)` |
| `reserveAssistantTextUsage(n)` | Upsert `text_sent_count = sent + n` if under limit |
| `releaseAssistantTextUsage(n)` | Best-effort decrement (rollback helper) |
| `getAssistantChatUsage` | Read chat turns for current UTC month |
| `reserveAssistantChatTurn` | Upsert `chat_turn_count = used + 1` if under limit |
| `releaseAssistantChatTurn` | Best-effort decrement if the model call fails after reserve |

**v1 Send path:** increment **+1 per delivered item** after a new `assistant_actions` `sent` row is created — never for failed SMS, opt-out, or missing phone.

**Ask chat path:** reserve **+1 per `POST /api/assistant/chat`** before streaming (after Pro + kill switch + burst rate limit).

UI (texts): prepare pill “`{sent}` of `{limit}` texts this month”.  
UI (Ask): composer ring; click shows “`{used}` of `{limit}` questions this month”.

**Monthly reset:** automatic. A new UTC calendar month uses a new `(business_id, year_month)` row (or zero counts). No cron job.

---

## RLS

- **SELECT:** owner or active manager.
- **INSERT / UPDATE / DELETE:** service role only.
