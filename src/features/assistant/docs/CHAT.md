# Assistant chat (Ask anything)

In-app Q&A for shop owners on `/dashboard/assistant`. Product copy stays **Assistant** (never “AI” / “Agent” / “MCP” in the UI).

SMS prepare/send stays separate — see **[FLOWS.md](./FLOWS.md)**. Tool catalog: **[TOOLS.md](./TOOLS.md)**.

---

## Status (shipped)

| Piece | State |
| --- | --- |
| `POST /api/assistant/chat` | Live — AI SDK stream + tool loop |
| Ask UI | Live — desktop rail; mobile full-screen via bottom CTA |
| Read tools | Live — 10 tools + `recordChatGap` |
| Chat history | **Not saved** — ephemeral per session |
| Gap signals | Live — `assistant_chat_gaps` via `recordChatGap` |
| Pro gate | Required — free sees teaser; Ask locked |
| Monthly turns | 30 / shop / UTC month (`chat_turn_count`) |
| Burst limit | ~10 / shop / 10 min (Upstash if configured, else in-memory) |
| Kill switch | `ASSISTANT_CHAT_DISABLED=1` → 503 |

**Migrations (Supabase, in order):** `001` → `002` → `003` → [`004_assistant_chat_turns.sql`](./migrations/004_assistant_chat_turns.sql).

**Prod env:** `OPENAI_API_KEY` (required for Ask). Optional: `ASSISTANT_CHAT_MODEL` (default `gpt-4o-mini`), `UPSTASH_REDIS_REST_*`, `ASSISTANT_CHAT_DISABLED`.

---

## Product decisions

| Choice | Decision |
| --- | --- |
| Surface | Ask anything on `/dashboard/assistant` |
| Audience | Non-dev owners |
| Access | **Pro only** (same `ownerHasProAccessForBusiness` as other Pro features) |
| MCP | Out of scope for v1 |
| Capability | **Read-only** tool calling for this shop only |
| Persistence | No threads/messages table yet — refresh clears the thread |
| Advisor style | Pull tools and answer in one turn — never ask “want me to look that up?” |
| Later | Write tools (menu save, invoice, etc.) with explicit confirm UX |

---

## How a turn works

```text
Owner asks (composer or suggestion chip)
  → POST /api/assistant/chat (cookie / Bearer)
  → customers.read → businessId from session (never from the prompt)
  → Pro check (403 pro_required if free)
  → OPENAI_API_KEY present
  → kill switch → burst rate limit → reserve 1 chat turn
  → LLM + tool loop (AI SDK, gpt-4o-mini by default)
      → only registered read tools
      → each tool scoped to that businessId
  → stream UI message reply
```

The model does **not** run SQL and does **not** pick a `businessId`.

**Example:** “How can I improve my service menu?”

1. Auth → Pro → reserve turn  
2. Model calls `getServiceMenu`  
3. Replies with current services + concrete suggestions  

One owner send = **one turn**, even if the model chains several tools.

---

## Cost controls

| Control | Detail |
| --- | --- |
| Pro | Free users: real morning data + upgrade teaser; prepare/Ask locked |
| Monthly turns | `ASSISTANT_BETA_CHAT_TURN_LIMIT` = **30** per shop per UTC `YYYY-MM` |
| Meter column | `assistant_usage_months.chat_turn_count` |
| Reset | Automatic — new UTC month → new row / zero count (no cron) |
| UI | Compact ring next to send; click shows “N of 30 questions this month” |
| Burst | `assertAssistantChatRateLimits` — ~10 questions / shop / 10 minutes |
| Kill switch | `ASSISTANT_CHAT_DISABLED` = `1` / `true` / `yes` / `on` |

Helpers: `assistantChatGuards.ts`, `assistantUsageMonth.ts` (`getAssistantChatUsage`, `reserveAssistantChatTurn`, `releaseAssistantChatTurn`).

**Note:** Turn is reserved before the stream starts. If the stream fails after the HTTP response has begun, the turn may still count (accepted launch caveat). Optimistic ring bump in the UI can get ahead of the server until refresh if the request fails.

---

## API

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/assistant/chat` | `customers.read` + Pro |

**Body (AI SDK `useChat`):** `{ "messages": UIMessage[] }` (max 40 messages).

**Client path:** `ASSISTANT_API.CHAT` in `constants/assistantApiPaths.ts`.

**Failure codes (examples)**

| Status | Code | Meaning |
| --- | --- | --- |
| 403 | `pro_required` | Not Pro |
| 429 | `chat_limit_reached` | Monthly turns exhausted |
| 429 | `rate_limited` | Burst limit |
| 503 | `chat_disabled` | Kill switch |
| 503 | `chat_not_configured` | Missing `OPENAI_API_KEY` |

---

## UI

| Surface | Behavior |
| --- | --- |
| Desktop | Right-hand Ask rail on morning layout |
| Mobile | Morning list only + fixed white **Ask anything** button → full Ask screen with back |
| Suggestions | Chips that only promise live tools |
| Composer | Cursor-style box; small send; usage ring |
| Thread | Ephemeral; streaming + thinking indicator |
| Markdown | Flat reply: paragraphs, lists, bold, `$` amounts; `#` headings stripped if the model emits them |
| Free | Suggestions / composer open Pro teaser instead of calling the API |

Code: `chat/components/AskAnythingRail.tsx`, `AssistantReplyText.tsx`, `ChatTurnRing.tsx`, `MorningMoment` mobile CTA.

---

## Tools

Full catalog: **[TOOLS.md](./TOOLS.md)**.

**Live reads:** `getRevenue`, `getExpenses`, `getUnpaidInvoices`, `getJobsSummary`, `getRecentJobs`, `getDueFollowUps`, `findCustomer`, `getTopCustomers`, `getServiceMenu`, `getBookingLink`.

**Gap:** `recordChatGap` → `assistant_chat_gaps` (not chat history).

| Rule | Enforcement |
| --- | --- |
| Tenant scope | `businessId` injected by the route |
| Writes | Not registered |
| Permissions | Chat needs `customers.read`; some tools also check Pro feature helpers (expenses/invoices) |
| Results | Summaries / top-N — not full CRM dumps |

System prompt: `chat/constants/assistantChatPrompt.ts` — keep tool list, chips, and prompt in sync when adding tools.

---

## Gaps (“can’t answer yet”)

| Piece | Detail |
| --- | --- |
| Table | `assistant_chat_gaps` — [ASSISTANT_CHAT_GAPS_TABLE.md](./ASSISTANT_CHAT_GAPS_TABLE.md) |
| How | Model calls `recordChatGap` before the honest redirect |
| Review | Weekly → add/widen one tool when a pattern repeats |

Miss template: honest one-liner + redirect to what **does** work (revenue, schedule, menu, etc.).

---

## Security checklist

- [x] `businessId` only from `requireBusinessPermission` / session  
- [x] Tools ignore tenant id in model args  
- [x] Read-only tools only in v1 registry  
- [x] Rate limit chat turns (monthly + burst)  
- [x] Cap tool result sizes in tool executors  
- [x] Pro required for chat  
- [ ] Persist / audit tool calls table (optional later)  
- [ ] Opt-out of provider training / minimize PII where practical (ops/policy)

---

## Code map

| Path | Role |
| --- | --- |
| `chat/components/AskAnythingRail.tsx` | Ask UI + `useChat` |
| `chat/server/runAssistantChatPoc.ts` | `streamText` + tools |
| `chat/tools/buildAssistantChatTools.ts` | Registry |
| `chat/tools/read/*` | Tool executors |
| `server/assistantChatGuards.ts` | Kill switch + reserve |
| `server/requireAssistantPro.ts` | Pro gate helper |
| `server/assistantUsageMonth.ts` | Text + chat meters |
| `src/app/api/assistant/chat/route.ts` | HTTP entry |
| `src/server/rateLimit/assistantChatRateLimit.ts` | Burst limiter |

---

## Data model (future — not shipped)

Do **not** overload `assistant_actions` for chat. Planned later if we persist history:

- `assistant_chat_threads` / `assistant_chat_messages`
- Optional `assistant_chat_tool_calls` for debugging

v1 only persists **gap signals** + **usage meters**, not the conversation.

---

## Later

1. Review `assistant_chat_gaps` weekly → widen tools  
2. Optional chat history  
3. Write tools with confirm UX (e.g. draft/save service menu)  
4. Upstash in prod for shared burst limits across instances  
5. Release reserved turn when a stream fails after start (if we want stricter fairness)
