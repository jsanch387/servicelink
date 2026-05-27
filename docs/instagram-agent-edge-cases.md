# Instagram DM agent — edge cases (deferred)

Automation is planned as a **Pro / paid tier** product. Most customers using this flow are expected to have bookings enabled. These cases are documented for later — not blocking MVP.

## `accept_bookings` off (request-only / V1 flow)

- **Risk:** Agent says “book instantly” when the public profile only accepts **requests**.
- **Mitigation (later):** Load `accept_bookings` from `business_availability` and use “request a time” vs “pick a time and book” wording.
- **If link still shown:** Profile may show request flow; avoid promising live calendar slots in DM.

## Free tier / booking cap

- Pro is required for `accept_bookings` in product rules; free users hit lifetime booking caps.
- Automation is not offered on Free — low risk of this combo in production.

## Missing `business_link` / slug

- Owner has not claimed a ServiceLink URL yet.
- **Mitigation (later):** Do not invent URLs; offer in-chat help only and optionally nudge owner in dashboard to create their link.

## Owner nudge (future)

- If `business_link` is null and DM volume is high, notify owner: “Connect your booking link so your IG assistant can send customers to your menu.”

## Booking link sent more than once

- **Desired:** Link **once** on first broad outreach (prices/menu). After the customer says what they need, **in-chat agent only** (no repeated URL).
- **Implemented:** `last_outbound_text` checked; `resolveShouldIncludeBookingLink` gates link; model instructed when `bookingLinkAlreadyShared` / `agentFlowActive`.
- Re-send link only if customer explicitly asks (“send me the link”, “website”, etc.).

## Deposit or card required before booking (`payment_settings`)

Some owners require a **deposit or full card checkout** before an appointment is confirmed (Stripe Connect + `payment_settings`: `payments_enabled`, `deposits_enabled`, `checkout_mode`, etc.). Public booking already handles this on the **ServiceLink profile / book flow** — the IG agent does **not** yet.

### Risk (today)

- Agent says “you’re booked” or “pick a time” in DM when the real flow still needs **Stripe Checkout** on the booking link.
- Customer expects to hold a slot without paying; owner expects deposit first.
- Agent cannot safely invent payment links.

### What works today (MVP)

- Send **`business_link`** (https) as primary self-serve path — customer picks service/time and pays deposit on the existing public checkout flow.
- In-chat path: collect intent (service, vehicle, date) but **defer confirmation** until we integrate payments or hand off to link.

### Future options (pick one or combine — not decided)

| Approach                   | Idea                                                                                                                       | Pros                                                                | Cons                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Link handoff**           | After qualifying in DM, send deep link to book flow (same as now, maybe prefill query params later)                        | Reuses existing checkout + webhooks; no new payment surface in Meta | Leaves IG thread; prefill TBD                          |
| **Generated checkout URL** | Server creates `booking_checkout_sessions` / Stripe Checkout from collected DM fields, agent sends one-time pay link in DM | Stays in IG until pay; matches deposit rules                        | Needs slot validation, idempotency, Meta link policies |
| **Soft hold + pay link**   | Reserve slot briefly, send pay link, release if unpaid                                                                     | Good UX for high demand                                             | Harder; timeout/cleanup                                |
| **Wording only**           | Load `payment_settings` into context; agent says “deposit required — complete booking here: [link]”                        | Small change                                                        | No true in-thread booking                              |

### Context to load (later)

- `payment_settings`: `payments_enabled`, `deposits_enabled`, `deposit_type`, `deposit_value`, `checkout_mode`
- Whether Stripe Connect is ready (`payment_accounts`)
- Never promise “no deposit” when `deposits_enabled` is true.

### Product note

Automation tier users are expected to be Pro with payments configured in many cases, but **not all** — agent copy should follow owner settings, not assume card-at-booking vs deposit vs pay in person.

**Status:** Documented only. Implement after core DM context + conversation memory (Step 3) and booking actions are stable.
