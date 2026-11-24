# Assistant — documentation index

Owner **Assistant** (product copy: never “AI” / “Agent”). It **prepares and suggests**; the owner **approves** every outbound text.

Start with **[FLOWS.md](./FLOWS.md)** for how the feature works. Use the database docs when writing SQL, RLS, or metering.

## Product & architecture

| Doc                          | When to read                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **[FLOWS.md](./FLOWS.md)**   | **Start here** — due rules, prepare/send, SMS, quota, suppression, APIs, UI |
| **[CHAT.md](./CHAT.md)**     | Ask-anything chat — tool calling, v1 read tools, schema, security (next)   |
| [DATABASE.md](./DATABASE.md) | ER diagram, RLS, related tables, example queries                             |

## Database tables

| Doc                                                              | When to read                         |
| ---------------------------------------------------------------- | ------------------------------------ |
| [ASSISTANT_ACTIONS_TABLE.md](./ASSISTANT_ACTIONS_TABLE.md)       | `assistant_actions` column reference |
| [ASSISTANT_USAGE_MONTHS_TABLE.md](./ASSISTANT_USAGE_MONTHS_TABLE.md) | `assistant_usage_months` meter   |

**Migrations (run in Supabase in order):**

1. [`migrations/001_assistant_actions.sql`](./migrations/001_assistant_actions.sql)
2. [`migrations/002_assistant_usage_months.sql`](./migrations/002_assistant_usage_months.sql)

## Related systems (not owned by this feature)

| System | Role for Assistant |
| ------ | ------------------ |
| `customers` / `bookings` / `reviews` | Compute who is due (read-only on open) |
| `review_invites` | Unique review URLs for review follow-ups |
| `sms_messages` + Telnyx via `sendAndRecordSms` | Delivery log for every outbound text |
| Team permissions | `customers.read` to open Assistant; `customers.write` to Skip/Send |

## App code map

| Path | Role |
| ---- | ---- |
| `../today/` | Due computation (`loadAssistantToday`, `buildAssistantToday`) |
| `../server/` | Decisions, usage meter, send orchestration |
| `../components/` | Dashboard UI (morning → prepare → send) |
| `../constants/` | Beta limit + API path constants |
| `src/app/dashboard/assistant/` | SSR page |
| `src/app/api/assistant/*` | HTTP routes |

## Status (v1 / beta)

**Shipped**

- Morning cards: review follow-ups + rebook check-ins only
- Prepare UI with shared message + quota pill
- Skip / Send with real SMS, `sms_messages` logging, quota, suppression
- Unique review invite URLs injected at send time

**Not yet**

- Ask-anything chat (LLM) — see **[CHAT.md](./CHAT.md)** (architecture locked; implementation next)
- Quotes / invoices cards in the morning list
- Paid tiers (beta = free capped try-out; limit in app config)
- Time-based re-nudge after send (sent stays suppressed until review or `unskipped`)
- MCP connector (optional later; same tools as in-app chat)
