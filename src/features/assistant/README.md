# Assistant

Owner dashboard feature: morning suggestions for **review follow-ups** and **rebook check-ins**. The owner prepares messages and approves every outbound SMS.

**Docs:** start at [`docs/README.md`](./docs/README.md) → [`docs/FLOWS.md`](./docs/FLOWS.md).

## Quick facts

| Item | Value |
| --- | --- |
| Route | `/dashboard/assistant` |
| Beta text cap | 30 / shop / UTC month |
| SMS types | `assistant_review_followup`, `assistant_rebook_checkin` |
| Tables | `assistant_actions`, `assistant_usage_months` (+ shared `sms_messages`, `review_invites`) |

## Next

**Ask-anything** chat — read-only tool calling (see [`docs/CHAT.md`](./docs/CHAT.md)). Architecture locked; build next.
