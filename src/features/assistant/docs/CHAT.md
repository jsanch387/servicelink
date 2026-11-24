# Assistant chat (Ask anything) — architecture

In-app Q&A for shop owners. Product copy stays **Assistant** (never “AI” / “Agent” / “MCP” in the UI).

This doc locks v1 decisions before implementation. SMS prepare/send stays separate ([FLOWS.md](./FLOWS.md)).

---

## Product decision

| Choice | Decision |
| --- | --- |
| Surface | **In-app** Ask anything rail on `/dashboard/assistant` |
| Audience | Non-dev owners — product-ready chat, not a developer connector |
| MCP | **Out of scope for v1.** Optional later: wrap the same tool functions for Cursor/Claude. Not required for owners. |
| Fixed data pack | **Rejected** as the product approach — wastes tokens and fails for “ask anything” |
| v1 capability | **Read-only tool calling** — fetch on demand for this shop only |
| Later | Same registry adds **write** tools (booking, invoice, customer) behind flags |

---

## How a turn works

```text
Owner asks a question in Ask anything
  → POST /api/assistant/chat (auth cookie / Bearer)
  → require customers.read → businessId from session (never from the prompt)
  → LLM + tool loop (AI SDK)
      → may call only registered read tools
      → each tool runs trusted loaders scoped to that businessId
  → model answers from tool results (or says it doesn’t know)
  → stream reply to UI; persist messages
```

The model does **not** run SQL and does **not** pick a `businessId`. Your server does.

**Example:** “How much did I make this month?”

1. Auth → `businessId`
2. Model calls `getRevenue({ period: "month" })`
3. Tool reuses Payments revenue loaders for that shop
4. Returns totals (+ top services)
5. Model replies in plain language

No customers/bookings pack is loaded unless another tool is called.

---

## Tool design rules (standards we follow)

Aligned with common agent-tool guidance (Anthropic / AWS / OpenAI):

1. **Tools match owner intents**, not raw tables or a kitchen-sink “payments” dump.
2. **Fetch only what’s needed** for the question (on-demand tools, not a fixed pack).
3. **Bundle what is usually asked together** (e.g. revenue total + top services in one tool).
4. **Keep tools distinct** — avoid a `mode` flag that means unrelated things.
5. **Separate read vs write** from day one; v1 registers reads only.
6. **Small catalog of composable primitives** — not one tool per possible sentence; the model chains tools.
7. **Narrow results** — return summaries / top-N, not entire CRM dumps into context.

---

## Handling gaps (“questions we don’t have a tool for”)

We will **never** ship a tool for every phrasing. That is intentional. Gaps are fixed with a loop, not a giant upfront catalog.

### 1. Compose, don’t enumerate

Most owner questions are combinations of a few facts. Prefer **primitives the model can chain** in one turn (AI SDK tool loop allows multiple calls).

**Example:** “Has my last detail left a review yet?”

```text
getRecentJobs({ status: "completed", limit: 1 })
  → { customerName, completedAt, serviceName, hasReview: false, … }

(optional) findCustomer({ query: that name }) if they ask a follow-up
```

No dedicated `hasLastDetailLeftReview` tool. Same path covers “who was my last job?”, “did they review?”, “when was the last detail?”.

If a question cannot be composed from registered tools → honest “I can’t look that up yet” (never invent).

### 2. Clarify when ambiguous

If “last detail” could mean last completed job vs last person named “Detail” vs a specific service:

- Ask one short clarifying question, **or**
- State the assumption (“Assuming you mean your most recent completed job…”) and answer from tools.

### 3. Log unanswered asks → grow the catalog

When the model cannot answer (or owner says that was wrong), persist a **gap signal**:

| Signal | Source |
| --- | --- |
| No tool used + refuse / “can’t look that up” | Chat turn |
| Tool returned empty / error and still unanswered | Tool log |
| Optional: thumbs-down / “Wrong answer” | UI later |

Review gap logs weekly → add or widen **one** tool when a pattern repeats (e.g. many unpaid-invoice questions → `getUnpaidInvoices`). Do **not** add a tool for a one-off.

### 4. Widen carefully, don’t explode the catalog

| Do | Don’t |
| --- | --- |
| Add a field to an existing tool (`hasReview` on recent jobs) | One-off tool per sentence |
| Add a new primitive when composition fails often | Kitchen-sink `queryAnything` SQL |
| Cap list sizes; keep args typed | Free-form SQL / OpenAPI dump |

### 5. Product copy for owners

When we truly can’t answer:

> I can’t look that up yet. I can check revenue, recent jobs, who needs a follow-up, and customer details — try one of those, or ask another way.

That keeps trust and feeds the gap log.

---

## Tool registry (foundation)

```text
assistant/chat/
  tools/
    registry.ts          # name → { kind: read|write, execute }
    read/
      getRevenue.ts
      getJobsSummary.ts
      getRecentJobs.ts
      getDueFollowUps.ts
      findCustomer.ts
      …
    write/               # empty in v1; createInvoice.ts later
```

| Rule | Enforcement |
| --- | --- |
| Tenant scope | `businessId` injected by chat route; tools must not accept it from the model |
| v1 writes | Write tools not registered (or hard-disabled) |
| Permissions | Chat requires `customers.read`; future writes will require the matching write permission |
| Fail closed | Unknown / disallowed tool → error; model told to refuse actions |

MCP later = thin adapter over **the same** `execute` functions with shop credentials — no second brain.

---

## v1 read tools (starting set)

Composable primitives — expect multi-tool turns. Grow from gap logs, not speculation.

### 1. `getRevenue`

**Answers:** How much did I make this week/month/year? What’s my top service?

| Arg | Type | Notes |
| --- | --- | --- |
| `period` | `"week" \| "month" \| "year" \| "all"` | Align with Payments revenue periods where possible |

**Returns (shape):**

```ts
{
  period: string
  collectedCents: number
  jobCount?: number
  previousCollectedCents?: number  // optional comparison
  byService: Array<{ serviceName: string; collectedCents: number; jobCount: number }>  // top ~5
}
```

**Implementation note:** Reuse `features/payments/revenue/*` loaders; do not invent a parallel money model.

---

### 2. `getJobsSummary`

**Answers:** What’s on the schedule today / this week? How busy am I?

| Arg | Type | Notes |
| --- | --- | --- |
| `range` | `"today" \| "week"` | Shop-local dates |

**Returns:** counts by status / day, light list of upcoming jobs (cap rows; names + times + service — no full PII dump).

---

### 3. `getRecentJobs`

**Answers:** Who was my last job? Has my last detail left a review? What did I finish yesterday?

| Arg | Type | Notes |
| --- | --- | --- |
| `status` | `"completed" \| "upcoming" \| "any"` | Default `"completed"` for “last detail” questions |
| `limit` | `number` | Default 5, max 10 |
| `customerQuery` | `string?` | Optional name filter |

**Returns (per job):** id, completedAt / startAt, customerName, customerId, serviceName, amountCents?, **hasReview**, reviewInviteSent?

This is the tool that closes the “last detail + review?” gap without a one-off tool.

---

### 4. `getDueFollowUps`

**Answers:** Who needs a review? Who should I check in with?

| Arg | Type | Notes |
| --- | --- | --- |
| `kind` | `"review" \| "check_in" \| "all"` | |

**Returns:** counts + short lists (reuse `buildAssistantToday` / due rules). Cap list length.

---

### 5. `findCustomer`

**Answers:** Tell me about Jordan / find a customer / did Jordan leave a review?

| Arg | Type | Notes |
| --- | --- | --- |
| `query` | `string` | Name / phone / email fragment |
| `limit` | `number` | Default 5, max 10 |

**Returns:** id, name, phone/email masked or partial, lastVisitAt, lastServiceName?, **hasReview**, upcomingBooking? — **this shop only**.

---

### Deferred (add when gap logs say so)

| Tool | When |
| --- | --- |
| `getExpenses` | Repeated spend questions |
| `getUnpaidInvoices` | Repeated unpaid / outstanding questions |
| `getAssistantUsage` | Texts left this month (quota pill already shows this) |
| Write tools | `createCustomer`, `createBooking`, `createInvoice`, `sendAssistantDraft` — **not v1** |

---

## System behavior

- Answer **only** from tool results + safe general help (“I can look up revenue, jobs, follow-ups…”).
- Prefer **chaining tools** over refusing when composition can answer.
- If no tool (or chain) fits: say you can’t look that up yet — **don’t invent** — and record a gap signal.
- If user asks to send texts / change data: refuse; point them to Prepare / dashboard actions.
- Prefer short, owner-friendly language (money as dollars, not raw cents in the final reply).

---

## Data model (planned)

Do **not** overload `assistant_actions` (that table is Skip/Send decisions only).

### `assistant_chat_threads`

| Column | Notes |
| --- | --- |
| `id` | uuid PK |
| `business_id` | FK shop |
| `user_id` | Owner/manager who chats |
| `created_at` / `updated_at` | |

v1: one active thread per `(business_id, user_id)` is enough (create-or-reuse).

### `assistant_chat_messages`

| Column | Notes |
| --- | --- |
| `id` | uuid PK |
| `thread_id` | FK |
| `role` | `user` \| `assistant` \| `system` |
| `content` | text |
| `created_at` | |

### Optional: `assistant_chat_tool_calls` (recommended early)

Log tool name, args, duration, ok/error for debugging and future “what did Assistant look up?” — not shown in v1 UI.

### Gap signals (recommended with chat v1)

Either a column on the assistant message (`unanswered: boolean`) or a small `assistant_chat_gaps` row:

| Column | Notes |
| --- | --- |
| `thread_id` / `message_id` | Link to the owner question |
| `business_id` | Shop |
| `question_excerpt` | Truncated user text (no secrets) |
| `reason` | `no_tool` \| `empty_result` \| `error` \| `thumbs_down` |
| `created_at` | |

Used only for product iteration — not shown to owners.

**RLS:** same pattern as other Assistant tables — owner/manager SELECT; service_role writes.

---

## API (planned)

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/assistant/chat` | `customers.read` |
| `GET` | `/api/assistant/chat` (optional) | Load recent thread messages |

**POST body (sketch):** `{ "message": "…", "threadId?": "…" }`  
**Response:** streamed assistant text (AI SDK UI message stream).

Client paths: add to `assistantApiPaths.ts` + `ROUTES` when implementing.

---

## UI

- Wire existing **Ask anything** rail on the morning Assistant screen.
- Streaming tokens; disable send while in flight.
- No tool-debug chrome for owners in v1.
- Errors → toast (same pattern as Send).

---

## Security checklist

- [ ] `businessId` only from `requireBusinessPermission` / session
- [ ] Tools ignore any tenant id in model args
- [ ] Read-only tools only in v1 registry
- [ ] Rate limit chat + tool rounds (cap steps per turn)
- [ ] Cap result list sizes
- [ ] No raw secrets / service keys in prompts
- [ ] Opt-out of training / minimize PII in prompts where practical

---

## Implementation order

1. ~~Architecture doc (this file)~~
2. SQL migration for threads + messages (+ tool_calls / gap signals)
3. Tool modules + registry (read only), unit-test loaders with fixed `businessId`
4. `POST /api/assistant/chat` with AI SDK `streamText` + tools (multi-step)
5. Wire Ask rail + persist messages; mark unanswered turns
6. Soften copy + refuse-actions + “what I can look up” prompts
7. Review gap logs → widen tools; later write tools; optional MCP wrapper

---

## Status

**Documented — not built yet.** SMS Assistant (prepare/send) is live; chat is next.
