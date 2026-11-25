# Assistant — documentation index

Owner **Assistant** (product copy: never “AI” / “Agent”). It **prepares and suggests**; the owner **approves** every outbound text. Ask anything answers shop questions with **read-only tools** (Pro).

Start with **[FLOWS.md](./FLOWS.md)** for SMS due/prepare/send. Use **[CHAT.md](./CHAT.md)** for Ask.

## Product & architecture

| Doc | When to read |
| --- | --- |
| **[FLOWS.md](./FLOWS.md)** | Due rules, prepare/send, SMS, text quota, suppression, APIs, UI |
| **[CHAT.md](./CHAT.md)** | Ask-anything — turn flow, Pro, meters, kill switch, UI, security |
| **[TOOLS.md](./TOOLS.md)** | Ask tool catalog — live + planned tools, args, status |
| [DATABASE.md](./DATABASE.md) | ER diagram, RLS, related tables, example queries |

## Database tables

| Doc | When to read |
| --- | --- |
| [ASSISTANT_ACTIONS_TABLE.md](./ASSISTANT_ACTIONS_TABLE.md) | `assistant_actions` (skip / send / unskip) |
| [ASSISTANT_USAGE_MONTHS_TABLE.md](./ASSISTANT_USAGE_MONTHS_TABLE.md) | Text + chat monthly meters |
| [ASSISTANT_CHAT_GAPS_TABLE.md](./ASSISTANT_CHAT_GAPS_TABLE.md) | Ask miss signals |

**Migrations (run in Supabase in order):**

1. [`migrations/001_assistant_actions.sql`](./migrations/001_assistant_actions.sql)
2. [`migrations/002_assistant_usage_months.sql`](./migrations/002_assistant_usage_months.sql)
3. [`migrations/003_assistant_chat_gaps.sql`](./migrations/003_assistant_chat_gaps.sql)
4. [`migrations/004_assistant_chat_turns.sql`](./migrations/004_assistant_chat_turns.sql) — `chat_turn_count`

## Related systems (not owned by this feature)

| System | Role for Assistant |
| --- | --- |
| `customers` / `bookings` / `reviews` | Compute who is due (read-only on open) |
| `review_invites` | Unique review URLs for review follow-ups |
| `sms_messages` + Telnyx via `sendAndRecordSms` | Delivery log for every outbound text |
| Pricing / Pro | `ownerHasProAccessForBusiness` — Assistant actions + Ask |
| Team permissions | `customers.read` to open / Ask; `customers.write` to Send (and Skip API) |

## App code map

| Path | Role |
| --- | --- |
| `../today/` | Due computation (`loadAssistantToday`, `buildAssistantToday`) |
| `../server/` | Decisions, text/chat meters, Pro gate, chat guards |
| `../chat/` | Ask UI, prompt, tools, stream runner |
| `../components/` | Morning, prepare, activity, Pro teaser |
| `../constants/` | Beta limits + API path constants |
| `src/app/dashboard/assistant/` | SSR page (`today`, text usage, chat usage, `isPro`) |
| `src/app/api/assistant/*` | HTTP routes |
| `src/server/rateLimit/assistantChatRateLimit.ts` | Ask burst limiter |

## Status (v1 / beta)

**Shipped**

- Morning: review follow-ups + rebook check-ins; activity preview (5) + View all
- Prepare + Send (Skip UI off for now; Skip API still exists)
- Real SMS, `sms_messages`, text quota (30/mo), suppression, review URLs at send
- Ask anything: tools, ephemeral thread, gaps, Pro gate, chat turns (30/mo), kill switch, mobile Ask screen
- Free: real due counts + upgrade teaser; actions locked

**Not yet / later**

- Quotes / invoices cards on the morning list
- Skip in the prepare UI (reintroduce when wanted)
- Persisted chat history
- Write tools (e.g. draft/save service menu) with confirm UX
- Upstash required in prod (optional; in-memory burst fallback works)
- Paid chat/text tiers beyond the beta constants
- Timed re-nudge after send (sent stays suppressed until review or `unskipped`)
- MCP connector (optional; same tools as in-app chat)

## Launch checklist

1. Migrations `001`–`004` applied on the target database  
2. `OPENAI_API_KEY` on the deploy env for Ask  
3. Smoke Pro: prepare → send; Ask suggestion + freeform; rings move  
4. Smoke free: sees data; prepare/Ask locked; APIs return `pro_required`  
5. Optional: `ASSISTANT_CHAT_DISABLED=1` kill switch  
6. Optional later: `UPSTASH_REDIS_REST_URL` + `TOKEN` for shared burst limits  
