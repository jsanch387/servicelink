# `assistant_chat_gaps`

Product signal when Ask-anything **cannot** answer. **Not** a chat transcript — no thread, no assistant reply text.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `business_id` | uuid | Shop |
| `question_excerpt` | text | Truncated owner question (≤ 500 chars) |
| `reason` | text | `no_tool` \| `empty_result` \| `error` \| `thumbs_down` |
| `topic_hint` | text? | Short tag from the model (e.g. `schedule`, `customer`, `invoice`) ≤ 80 |
| `created_at` | timestamptz | |

**Writes:** `service_role` only (via `recordChatGap` tool).  
**Reads:** owner / manager SELECT (same pattern as other Assistant tables).

**Migration:** [`migrations/003_assistant_chat_gaps.sql`](./migrations/003_assistant_chat_gaps.sql)

## How gaps get recorded

1. Owner asks something we can’t answer with live tools.
2. Model calls **`recordChatGap`** (required by system prompt) with excerpt + reason.
3. Row inserted; model then replies with the honest redirect.

Optional later: UI thumbs-down → `reason: thumbs_down`.

## Review cadence

Weekly (or before adding a tool): group by `topic_hint` / skim `question_excerpt`.  
Add or widen **one** tool when a pattern **repeats** — ignore one-offs.
