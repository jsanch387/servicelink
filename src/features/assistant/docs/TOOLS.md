# Assistant chat — tool catalog

Canonical list of Ask-anything tools. Product copy stays **Assistant** (never “AI” / “Agent” in the UI).

Architecture, cost controls, UI: **[CHAT.md](./CHAT.md)**.  
Registry: `src/features/assistant/chat/tools/buildAssistantChatTools.ts`.

**Status:** All **V1 must-ship** tools below are **Live**.

**Rules**

- `businessId` always comes from the session — never from the model.
- v1: **read-only** tools only.
- Prefer composing existing tools over adding one-off tools for every phrasing.
- Target live catalog size: ~10–12 read tools.
- Keep this file, the system prompt, and Ask suggestion chips in sync when adding tools.

---

## V1 must-ship (good product bar)

A solid v1 answers the questions owners ask **every week** without bouncing to “I can’t look that up yet.” That’s **10 read tools** — not the whole dashboard.

| # | Tool | Why it’s in v1 |
| --- | --- | --- |
| 1 | **`getRevenue`** | Live — “How much did I make?” |
| 2 | **`getServiceMenu`** | Live — menu feedback / what’s on booking |
| 3 | **`getJobsSummary`** | Live — “What’s today / this week?” |
| 4 | **`getRecentJobs`** | Live — “Last job / did they review?” |
| 5 | **`getDueFollowUps`** | Live — “who should I text?” (morning Assistant rules) |
| 6 | **`findCustomer`** | Live — “Tell me about Jordan” |
| 7 | **`getTopCustomers`** | Live — “Who are my best customers?” (high ask; not covered by find) |
| 8 | **`getExpenses`** | Live — money out / pairs with revenue |
| 9 | **`getUnpaidInvoices`** | Live — “Who owes me?” — cash-flow pain |
| 10 | **`getBookingLink`** | Live — “What’s my booking link?” — tiny tool, constant ask |

Plus **`recordChatGap`** (live) — product miss signal, not a user-facing capability.

**Compose, don’t duplicate:** “Did I profit this month?” = `getRevenue` + `getExpenses`. “Did Jordan leave a review after the last detail?” = `getRecentJobs` and/or `findCustomer`.

**Not required for v1** (ship after, or when gap logs scream): `getQuotePipeline`, `getReviewsSummary`, `getSubscriptionsSummary`, `getAvailabilityGaps`, `getAssistantUsage`, full `getShopFront` profile audit, any **writes**.

---

## Status legend

| Status | Meaning |
| --- | --- |
| **Live** | Registered in `buildAssistantChatTools` and callable in chat |
| **Later** | After v1 / when gap logs say so |
| **Not planned** | Owners use the dashboard screen instead |

---

## Live (registered today)

### `getRevenue`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Money in |
| **Answers** | How much did I make this week / month / last month / year / all time? What’s my top service? |
| **Args** | `period`: `week` \| `month` \| `last_month` \| `year` \| `all` |
| **Returns** | `collectedCents`, `collectedLabel`, `jobCount`, previous period compare, top services (`byService`) |
| **Code** | `chat/tools/read/getRevenue.ts` |
| **Reuse** | `features/payments/revenue/*` |

---

### `getServiceMenu`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Shop front |
| **Answers** | What’s on my menu? How can I make it easier for customers to choose? Missing descriptions? |
| **Args** | none |
| **Returns** | Active services (name, description, price, duration, category, price options, add-ons) + `missingDescriptionCount`, `priceRangeLabel` |
| **Code** | `chat/tools/read/getServiceMenu.ts` |
| **Reuse** | `loadQuoteServiceCatalog` |

---

### `recordChatGap`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Product iteration (not shown to owners) |
| **Answers** | n/a — logs a miss so we can grow the catalog |
| **Args** | `questionExcerpt`, `reason`, optional `topicHint` |
| **Returns** | `{ ok: true }` |
| **Code** | `chat/tools/read/recordChatGap.ts` |
| **Table** | `assistant_chat_gaps` |

---

## V1 tools (all live)

### `getJobsSummary`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Schedule |
| **Answers** | What’s on the schedule today / this week? How busy am I? |
| **Args** | `range`: `today` \| `week` |
| **Returns** | Counts by status/day + short upcoming list (cap rows; name, time, service) |
| **Reuse** | Bookings / availability loaders |

---

### `getRecentJobs`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Schedule + trust |
| **Answers** | Who was my last job? Has my last detail left a review? What did I finish yesterday? |
| **Args** | `status`: `completed` \| `upcoming` \| `any` (default `completed`); `limit` ≤ 10; optional `customerQuery` |
| **Returns** | Per job: times, customer, service, amount?, **`hasReview`**, reviewInviteSent? |
| **Reuse** | Bookings + reviews |

---

### `getDueFollowUps`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Customers & trust (ties to morning Assistant) |
| **Answers** | Who needs a review? Who should I check in with? Who should I text this week? |
| **Args** | `kind`: `review` \| `check_in` \| `all` |
| **Returns** | Counts + short lists |
| **Reuse** | `buildAssistantToday` / due rules |

---

### `findCustomer`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Customers & trust |
| **Answers** | Tell me about Jordan / find a customer / did they leave a review? |
| **Args** | `query` (name / phone / email fragment); `limit` ≤ 10 |
| **Returns** | id, name, masked contact, lastVisitAt, lastServiceName?, **hasReview**, upcomingBooking?, visitCount?, spendLabel? — this shop only |
| **Reuse** | Customer management / `aggregateBookingsPerCustomer` |

---

### `getTopCustomers`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Customers & trust |
| **Answers** | Who are my top / best customers? Who spends the most? |
| **Args** | `limit` ≤ 10 (default 5); optional `period`: `month` \| `year` \| `all` |
| **Returns** | Ranked list: name, visitCount, spendLabel, lastVisitAt |
| **Reuse** | Same customer spend aggregations as Customers screen |

---

### `getExpenses`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Money out |
| **Answers** | What did I spend this month / last month? By category? |
| **Args** | `period`: `week` \| `month` \| `last_month` \| `year` \| `all` |
| **Returns** | `totalCents`, `totalLabel`, byCategory top N |
| **Reuse** | `expenses/*` |

---

### `getUnpaidInvoices`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Money owed |
| **Answers** | Who owes me? What’s outstanding? |
| **Args** | optional `limit` ≤ 10 |
| **Returns** | Count, total outstanding label, short list (customer, amount, due/status) |
| **Reuse** | `invoices/*` |

---

### `getBookingLink`

| | |
| --- | --- |
| **Status** | Live |
| **Owner job** | Shop front |
| **Answers** | What’s my booking link? What’s my public URL? |
| **Args** | none |
| **Returns** | `bookingUrl`, business name, slug (if set) |
| **Reuse** | Business profile slug + app base URL |

---

## Later (after v1)

| Tool | Answers | Why not v1 |
| --- | --- | --- |
| **`getQuotePipeline`** | Open quotes / booking requests | Strong for quote-heavy shops; not every owner |
| **`getReviewsSummary`** | Rating trend / recent review text | Mostly covered by `getDueFollowUps` + `getRecentJobs.hasReview` |
| **`getShopFront`** | Profile completeness audit | `getBookingLink` covers the common ask |
| **`getSubscriptionsSummary`** | Plans / subscribers | Niche unless memberships are core |
| **`getAvailabilityGaps`** | Open slots this week | Needs clean availability data |
| **`getAssistantUsage`** | Texts left this month | Already on the quota pill |

---

## Writes (not POC)

Same registry later; separate permissions; **never** silent outbound.

| Tool | Notes |
| --- | --- |
| **`sendAssistantDraft`** | Only after Prepare-style owner confirm |
| **`createBooking`** | Explicit confirm UX |
| **`createInvoice`** | Explicit confirm UX |
| **`createCustomer`** | Explicit confirm UX |

---

## Not planned as chat tools (for now)

Team settings, payment fee config, marketing promo CRUD, internal acquisition — use the dashboard screens.

---

## Owner job → tools (quick map)

| Owner job | Dashboard | V1 tools |
| --- | --- | --- |
| Money in | Payments | `getRevenue` |
| Money out / owed | Expenses, Invoices | `getExpenses`, `getUnpaidInvoices` |
| Schedule | Bookings | `getJobsSummary`, `getRecentJobs` |
| Customers & trust | Customers, Reviews, Assistant | `findCustomer`, `getTopCustomers`, `getDueFollowUps` |
| Shop front | Services, Booking link | `getServiceMenu`, `getBookingLink` |

---

## Suggested next (after v1)

1. Review `assistant_chat_gaps` weekly
2. Add tools only when the same miss repeats (`getQuotePipeline`, etc.)
3. Writes + confirm UX later

---

## Keeping this doc honest

When you register or remove a tool in `buildAssistantChatTools.ts`, update this file in the same change (status + contract).
