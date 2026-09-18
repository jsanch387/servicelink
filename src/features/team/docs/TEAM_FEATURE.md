# Team feature

How Team works in ServiceLink today. Same product on web and mobile: one shop, one owner, people they hire to run jobs.

This file is feature documentation for this repo and for the mobile app repo. It explains the feature. It is not a build prompt.

Related in this repo: [`V1_JOB_RUN.md`](./V1_JOB_RUN.md) (job-run decisions), [`DATABASE.md`](./DATABASE.md) (tables).

---

## What it is

The owner of a shop can invite people by email. After they accept, they log in with a normal ServiceLink account and work **that owner’s shop**. They see the board and run appointments. They do not own the business, billing, booking link, or customer list.

The common shop is two people: the owner and one hire. A job comes in unassigned. Anyone on the shop can run it. A name on the card is so the board stays organized. **The assignee is a label, not a lock.** If Alex is assigned and out sick, Jordan still taps On the way.

Team is not a second billing plan, not a manager role picker, and not per-person calendars.

---

## Two kinds of people

| | Owner | Teammate (member) |
| --- | --- | --- |
| Who | Created the shop (`business_profiles.profile_id`) | Added by the owner (`business_members`) |
| In `business_members`? | Never | Yes |
| Shop they open | Their own | The owner’s |
| Can invite / remove | Yes | No |
| Can run jobs | Yes | Yes |
| Can edit / cancel / reschedule / create appointments | Yes | No |
| Can open Settings, Payments, Team, Quotes, Reviews, Customers | Yes | No |

v1 has one hired role: **member**. A `manager` role exists in the permission map but is not used in the product yet.

A person can own a shop **or** be an active member of one shop. Not both. Accepting an invite fails if that login already owns a business or is already active on another team.

---

## How someone joins

1. **Owner invites.** On web: Dashboard → Team. They enter an email. The owner cannot invite themselves. They cannot invite an email that is already an **active** member.
2. **Email goes out.** Subject is an invite to join that shop. The link is `/team/invite/<token>`. The raw token is never stored; we store a SHA-256 hash. The invite expires in **14 days**.
3. **Invitee opens the link (web).** If they are signed out, they create an account or sign in **with that same email** (password, Google, or Apple). If they are already signed in as that email, accept runs automatically.
4. **Accept.** `POST /api/team/invites/accept` with `{ token }`. Email on the login must match the invite. Then:
   - New user → insert `business_members` (`role = member`, `status = active`)
   - Former member of **this** shop → flip the existing row back to `active`
   - Invite row → `accepted`, `accepted_user_id` set
5. **They land on the shop dashboard**, not owner onboarding.

Resend: if a **pending** invite already exists for that shop + email, we refresh the token and expiry and email again. After they joined and were later **removed**, we reopen that same invite row (`revoked` → `pending`, new token) and email again. One invite row per shop + email.

Pending invites (not accepted yet) do not appear in the assignee list.

---

## What happens when they log in

Same Supabase Auth user as web. Mobile sends `Authorization: Bearer <access_token>`. Web uses cookies. APIs that already accept both treat them the same.

The shop is resolved in this order:

1. Signed-in user owns a `business_profiles` row → **owner** of that shop
2. Else they have an **active** `business_members` row → **member** of that shop
3. Else no shop

Members skip owner onboarding. They are not starting a business; they are joining one.

If they were **removed** and they have no shop of their own, they are not dumped into onboarding. They see a full-screen “You’re no longer on this team” state: shop name, short explanation, **Log out**, and a **Create your own business** link (starts owner onboarding). They cannot open that shop’s bookings until a new invite is accepted.

If they later start their own business, owned-shop-first still wins. They are an owner of their shop, not a member of the old one.

---

## What they see

### Owner

Full dashboard. Sidebar includes Dashboard, Bookings, Team, Reviews, Quotes, Customers, Availability, Payments, Marketing, Booking link, Services, and the rest of shop setup. Team is its own page (`/dashboard/team`), not a Settings tab.

### Member (active)

Only what they need to work:

| Surface | Member |
| --- | --- |
| Home / Dashboard | Shop name + **Upcoming appointments**. No share-link, revenue, upgrade, or owner quick actions. |
| Bookings | Full shop board (list + calendar). Every job, not only theirs. |
| Assigned to me / View all | Filter only. Does not change permissions. “Mine” = `assigned_user_id` is the signed-in user (including when the owner filters to themselves). |
| Job sheet | Customer / address / time on the **appointment**. Run + collect pay. |
| Team, Settings, Payments, Quotes, Reviews, Customers, Availability, Marketing, Booking link, Services | Hidden. APIs return **403**. |

Assignee UI (dropdown / name on the card) shows only when the shop has at least one hire (or a former hire, so past jobs can still show a name). A solo shop hides it.

Display names are not a separate profile field yet. We show **email**. Owner is labeled `email (owner)`. Never a blank chip.

---

## Permissions

Do not check `role === 'member'` in product code. Check a capability.

| Permission | Owner | Member | What it means |
| --- | --- | --- | --- |
| `dashboard.read` | yes | yes | Open the shop home |
| `bookings.read` | yes | yes | See the board and job details |
| `bookings.run` | yes | yes | On the way, started, finished, complete, collect pay, change assignee |
| `bookings.write` | yes | **no** | Create, edit, cancel, delete, reschedule, accept booking requests |
| `team.manage` | yes | no | Invite and remove |
| `customers.read` / `write` | yes | no | Customers page |
| `quotes.read` / `write` | yes | no | Quotes |
| `reviews.read` / `write` | yes | no | Reviews |
| `profile.write` | yes | no | Booking link / shop profile |
| `services.write` | yes | no | Services catalog |
| `availability.write` | yes | no | Hours and time off |
| `marketing.write` | yes | no | Marketing |
| `billing.manage` | yes | no | Subscriptions |
| `payments.manage` | yes | no | Revenue, Stripe settings, walk-up charges |
| `account.delete` | yes | no | Delete the account |

`bookings.run` is **not** “only if assigned to me.” It is shop-wide. Do **not** grant members `bookings.write` to unlock the job sheet — that also unlocks cancel / edit / reschedule.

---

## Bookings and assignee

- `bookings.assigned_user_id` is a user id (`auth.users`), or `null` (Unassigned).
- It can be the **owner** or an **active** member. The owner is not in `business_members` and can still be assigned.
- New public bookings stay Unassigned. The owner does not have to assign every job.
- Anyone on the shop (owner or member) can set, change, or clear the name on a job that is **not completed**. Completed jobs keep the person who ran them.
- Status does not reset when the name changes. Reassign after On the way is allowed.
- Pending invites are not assignable. Assign after they accept.
- A removed person stays on **past / completed / cancelled** jobs as a **former** label. **Upcoming confirmed** jobs are cleared to Unassigned when they are removed.

---

## Running a job

Same job sheet the owner already uses. The member is acting **as the shop**.

Typical order:

1. On the way → customer SMS from the shop
2. Job started → customer SMS from the shop
3. Work finished
4. Complete + collect pay (card, Tap to Pay, invoice, cash / Venmo / other)

Money lands on the **owner’s** Stripe Connect. Members never open Payments settings or payouts. Walk-up charges (not attached to a booking) stay owner-only.

On the way / Started / Finished are the phone job steps. Web Complete + collect pay is already open to members (`bookings.run`). Two people tapping On the way at once: one wins, the other gets a conflict (`409`). No extra lock.

Customer SMS still uses the shop name. Rate limit is **per signed-in user** (not the owner’s id), so one busy bay does not burn the whole shop.

---

## Overlap (current)

A team shop can have two jobs at the same time.

- **Owner create** and **owner reschedule** may stack jobs. Heads-up only (same day / same time). Not a hard block.
- **Public book, quote accept, and membership book** still refuse a taken slot. That is still the solo public calendar. Shop hours and shop time off still apply.
- Time off is **shop closed**, not “owner PTO.”
- No capacity = number of teammates. No per-person calendars in v1.
- Same person on two overlapping jobs is allowed.

---

## Emails

| When | Who gets it | Notes |
| --- | --- | --- |
| Owner invites (or resends) | Invite email | Join link. 14-day expiry. |
| Someone is assigned a job | That assignee | Only if the next person is set, different from before, and **not** the person who assigned it (no email for self-assign or unassign). CTA is Bookings. |
| Member is removed | None | They are signed out. |

Members do not get a push when a new booking comes in. They open Bookings.

---

## Removing someone

The owner removes from Team. We **do not delete** the Auth user.

What changes:

- `business_members.status` → `removed`
- Their accepted invite → `revoked` (same row; a later invite reopens it)
- Upcoming **confirmed** jobs they were on → Unassigned
- Past / completed / cancelled keep their name
- All of their sessions are signed out (`signOut` global)

They cannot walk back in without a new invite. After a new invite + accept, the **same** membership row becomes `active` again.

---

## Data model (short)

```
business_profiles.profile_id  →  owner
business_members              →  people the owner added
team_invites                  →  email invites (pending / accepted / revoked / expired)
bookings.assigned_user_id     →  owner or active member, or null
```

- Unique active membership: a user is an active member of at most one shop.
- Unique pending invite: one pending invite per shop + email.
- Members can SELECT the shop work tables they need for the board (bookings, booking requests, shop rows). Customers, quotes, and reviews are owner-only. Job writes go through APIs after a permission check (not “member can UPDATE any booking column”).

SQL lives in [`migrations/`](./migrations/README.md).

---

## APIs Team uses

Auth: web cookies **or** `Authorization: Bearer <Supabase access_token>`.

| Method | Path | Who | What |
| --- | --- | --- | --- |
| GET | `/api/team/members` | Owner (`team.manage`) | Active members + pending invites |
| POST | `/api/team/invites` | Owner | Send or resend invite email |
| POST | `/api/team/invites/accept` | Signed-in invitee | Accept token, join or rejoin |
| POST | `/api/team/remove` | Owner | Revoke pending invite **or** remove an active member |
| GET | `/api/availability/bookings` | `bookings.read` | List / calendar. `assignedToMe=true` filters to the signed-in user |
| GET | `/api/availability/bookings/assignees` | `bookings.read` | Owner + active members + former labels |
| PATCH | `/api/availability/bookings/:id/assignee` | Shop (`bookings.read` + run) | Body `{ assignedUserId: string \| null }` |
| POST | `/api/availability/bookings/:id/actions` | `bookings.run` | `on_the_way`, `job_started`, work finished, `job_completed` |

Owner-only booking writes (edit, cancel, delete, reschedule, create) stay on the existing owner routes and require `bookings.write`.

Shop resolution for these routes is **owned shop first, then active membership**. Any route that still loads the shop as `business_profiles.profile_id = signed-in user` will 404 for a member. That includes Tap to Pay connection-token paths that look up Connect that way: collect-on-the-job must use the **owner’s** connected account.

---

## Same product on mobile

Team is not a different feature on the phone. A hire logs in with the same account and works the owner’s shop.

What that means in product terms:

- After login, resolve **owner shop or active membership**. Do not send a member through owner onboarding.
- Show Dashboard + Bookings. Hide owner office screens (Team, Payments, Settings, Quotes, Reviews, Customers, shop setup).
- Show every job. “Assigned to me” is a filter.
- Anyone on the shop can run any job. Assignee does not gate On the way.
- Collect pay as the shop. Do not open Revenue / Stripe settings.
- If they were removed: they are not on the shop. Do not treat them as a new owner unless they choose to create their own business.

On the way / Started / Finished and Tap to Pay already exist as owner phone flows. Members use those same flows and the same APIs. Web already has invite, accept, Team page, board, assignee, Complete, remove, and the removed-from-team screen.

---

## Out of this feature

- Display names (email is enough for now)
- Public customers double-booking a slot (owner can stack; public calendar still blocks)
- Capacity, per-person calendars, “only the assignee can run it”
- Auto-claim on On the way
- Member create-appointment
- Member push on new bookings
- Team billing / seat count
- Manager role in the UI
- “Alex is coming” on customer SMS
