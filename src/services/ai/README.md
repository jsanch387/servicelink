# AI services (Instagram automation)

## Intent parser + reply

`parseAndFormulateResponse(messageText)` uses **gpt-4.1-nano** (lowest-cost structured-output model for this use case) with `zodResponseFormat` + `ConversationIntentSchema`. Output capped at 256 tokens.

Returns:

- `isBookingInquiry`, `packageName`, `requestedDate` (YYYY-MM-DD or null)
- `shouldIncludeBookingLink` — when to paste the owner's ServiceLink URL
- `aiReplyText` — customer-ready Instagram DM copy

Context includes `bookingLink` from `business_profiles.business_link` (always normalized to `https://`). General pricing/menu questions should point to the link, not list every service.

Edge cases (deferred): [docs/instagram-agent-edge-cases.md](../../../docs/instagram-agent-edge-cases.md)

### Env

| Variable         | Required | Notes                                                   |
| ---------------- | -------- | ------------------------------------------------------- |
| `OPENAI_API_KEY` | Yes      | [OpenAI API keys](https://platform.openai.com/api-keys) |

Webhook: `src/app/api/webhooks/instagram/route.ts` runs the full loop via `processInstagramIncomingDm` (async; Meta still gets `200` immediately).

Meta outbound: `src/services/meta/messenger.ts` (`META_PAGE_ACCESS_TOKEN`).
