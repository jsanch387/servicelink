# Onboarding V2 — New Flow (Spec & Context)

This folder holds the **new onboarding flow**, kept separate from the current flow (`src/features/onboarding`) until we’ve tested, released, and fixed production bugs. The existing flow remains the default until we switch over.

---

## Flow Overview (5 Steps)

| Step | Name        | Purpose |
|------|-------------|--------|
| 1    | **The Hook**    | Welcome + “What’s your business name?” — Low friction, creates immediate ownership. |
| 2    | **The Core**    | Add **at least one** service: name, price, **duration** (30m–10h30, 30-minute steps), and what’s included. More services can be added later from the dashboard. |
| 3    | **The Engine**  | **Availability** — “When do you work?” (e.g. Mon–Fri, 9–5). Don’t leave this as a chore for later. |
| 4    | **The Launch**  | **Claim your custom link** (e.g. `app.com/u/joyce-braids`). Feels like a reward. |
| 5    | **The Result**  | **Redirect to live profile** (not dashboard). Show what customers see; builds instant pride. |

---

## Step Details (for implementation)

1. **The Hook** — Welcome + business name only. Minimal fields to create ownership.
2. **The Core** — At least one service with **duration** stored as `duration_minutes` (same picker rules as dashboard services). Multi-service list is optional in this step; users are told they can finish the full menu after onboarding.
3. **The Engine** — Availability as a first-class step: “When do you work?” (e.g. Mon–Fri, 9–5).
4. **The Launch** — Custom link (slug) as the “launch” moment, framed as a reward.
5. **The Result** — After completion, redirect to the **public live profile** (e.g. `/{slug}`), not the dashboard.

---

## Relationship to Current Flow

- **Current flow** lives in `src/features/onboarding` and stays unchanged.
- **New flow** is implemented here in `onboarding-v2`.
- Routing/feature flags will decide which flow a user sees until we fully cut over.
