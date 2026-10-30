# Team

How Team works in ServiceLink today. One shop, one owner, people they hire. Web and mobile use the same account and the same permissions.

Schema and row access: [`DATABASE.md`](./DATABASE.md). Mobile invite and remove: [`docs/contracts/`](../../../docs/contracts/).

---

## What it is

The owner invites people by email. After they accept, they log in with a normal ServiceLink account and work that owner's shop. They do not own the business.

The owner picks a role on the invite and can change it later from the Team page. There is no separate permission table. The database stores the role. The app maps that role to capabilities in `ROLE_PERMISSIONS`.

Check a capability (`can(ctx, 'bookings.write')`). Do not check `role === 'member'`.

A name on a job is a label, not a lock. If Alex is assigned and out sick, Jordan can still run the job.

Team is a billing plan for shops that were not already using it. Shops with `team_included` keep invites on their current price. New shops buy Team, then each person on that shop uses the app with the owner's Pro tools. There are no per-person calendars.

A person can own a shop or be an active member of one shop. Not both. Accepting an invite fails if that login already owns a business or is already active on another team.

---

## Roles

The owner is the account that created the shop (`business_profiles.profile_id`). The owner is never a `business_members` row and is not an assignable role.

| Product name | Stored role   | Who it is                                                                                  |
| ------------ | ------------- | ------------------------------------------------------------------------------------------ |
| Owner        | `owner`       | Created the shop. Every capability, including the four locks below.                        |
| Member       | `member`      | Default. Sees every appointment. Runs the job, takes payment, and changes who is assigned. |
| Coordinator  | `coordinator` | Same as Member, plus adding, rescheduling, canceling, and deleting appointments.           |
| Manager      | `manager`     | Same as Coordinator, plus customers, quotes, invoices, expenses, reviews, and the shop.    |

| Request                                                                                    | Role        |
| ------------------------------------------------------------------------------------------ | ----------- |
| Hire who only completes appointments                                                       | Member      |
| Employee who needs to schedule or reschedule                                               | Coordinator |
| Partner who needs to see every booking and adjust it                                       | Coordinator |
| Trusted partner who should run the shop without billing, payouts, the team, or the account | Manager     |

### Owner only

These four stay with the owner. A manager does not get them.

| Permission        | Why it stays with the owner                  |
| ----------------- | -------------------------------------------- |
| `account.delete`  | Closes the account and deletes the shop      |
| `billing.manage`  | Plan, upgrade, and subscription              |
| `payments.manage` | Stripe, payouts, and payment settings        |
| `team.manage`     | Who is on the team, and which role they have |

Collecting pay on a job is `bookings.run`. Opening Revenue or Stripe is `payments.manage`.

---

## Permissions

Yes means the role includes that permission. `isOwner` grants every permission, including ones added later.

| Permission                           | Member | Coordinator | Manager | Owner |
| ------------------------------------ | ------ | ----------- | ------- | ----- |
| `dashboard.read`                     | Yes    | Yes         | Yes     | Yes   |
| `bookings.read`                      | Yes    | Yes         | Yes     | Yes   |
| `bookings.run`                       | Yes    | Yes         | Yes     | Yes   |
| `bookings.write`                     |        | Yes         | Yes     | Yes   |
| `bookings.delete`                    |        | Yes         | Yes     | Yes   |
| `customers.read` / `customers.write` |        |             | Yes     | Yes   |
| `quotes.read` / `quotes.write`       |        |             | Yes     | Yes   |
| `invoices.read` / `invoices.write`   |        |             | Yes     | Yes   |
| `expenses.read` / `expenses.write`   |        |             | Yes     | Yes   |
| `reviews.read` / `reviews.write`     |        |             | Yes     | Yes   |
| `profile.write`                      |        |             | Yes     | Yes   |
| `services.write`                     |        |             | Yes     | Yes   |
| `availability.write`                 |        |             | Yes     | Yes   |
| `marketing.write`                    |        |             | Yes     | Yes   |
| `payments.manage`                    |        |             |         | Yes   |
| `billing.manage`                     |        |             |         | Yes   |
| `team.manage`                        |        |             |         | Yes   |
| `account.delete`                     |        |             |         | Yes   |

`bookings.run` is shop-wide. It is not limited to jobs assigned to that person. It covers on the way, started, finished, complete, collect pay, and change assignee.

`bookings.write` is a new appointment, edit, reschedule, cancel, and accept a request. `bookings.delete` is a separate permission. Coordinator and manager have it. Member does not.

---

## What each role sees

### Owner

Full dashboard, including Payments, Subscriptions, Team, and Settings.

### Member and Coordinator

Dashboard and Bookings. Coordinator extras are actions on the booking (create, reschedule, cancel, delete), not extra sidebar items.

Home for a hire is the shop name and upcoming appointments. No share-link, revenue, upgrade, or owner quick actions.

### Manager

Dashboard, Booking link, Services, Bookings, Reviews, Quotes, Invoices, Expenses, Customers, Availability, and Marketing.

Not Payments, Subscriptions, Team, or Settings. Those pages redirect if a hire opens the URL.

A screen the role cannot open returns 403 from the API.

---

## How someone joins

1. **Owner invites.** Dashboard → Team. They enter a name, email, and role. Default role is Member. Mobile may omit `role`; omitted means Member. The owner cannot invite themselves or an email that is already an active member.
2. **Email goes out.** The link is `/team/invite/<token>`. The raw token is never stored. We store a SHA-256 hash. The invite expires in 14 days.
3. **They open the link on the web.** They sign in or create an account with that same email. If they are already signed in as that email, accept runs automatically.
4. **Accept.** `POST /api/team/invites/accept` with `{ token }`. The login email must match the invite. Then:
   - New user → insert `business_members` with the invite's role and `status = active`
   - Former member of this shop → set that row back to `active` and copy the invite's role onto it
   - Invite row → `accepted`, `accepted_user_id` set
5. **They land on the shop dashboard**, not owner onboarding.

Resend: a pending invite for that shop and email refreshes the token, the expiry, and the email. After someone was removed, a new invite reopens that same row (`revoked` → `pending`) and emails again. One invite row per shop and email.

The invite name is the label on Team and on assignee chips. It stays after accept. Older rows without a name still show email.

Pending invites do not appear in the assignee list.

---

## Changing a role

The owner opens the person on the Team page and picks a new role. No second invite.

- Pending invite: `team_invites.role` updates. Accept copies that role onto `business_members`.
- Active member: `business_members.role` updates, and the accepted invite is updated too, so a later rejoin keeps the role the owner just picked.

The hire sees the new menu after a refresh. The owner still cannot assign `owner`.

Existing members stay Member until the owner changes them.

---

## When they log in

The shop is resolved in this order:

1. Signed-in user owns a `business_profiles` row → owner of that shop
2. Else they have an active `business_members` row → that role on that shop
3. Else no shop

If the shop cannot be resolved, the sidebar does not fill in the owner. It shows no shop links.

Hires skip owner onboarding. If they were removed and they have no shop of their own, they see “You’re no longer on this team”: shop name, Log out, and Create your own business. They cannot open that shop’s bookings until a new invite is accepted.

If they later start their own business, the owned shop wins. They are an owner of their shop, not a member of the old one.

---

## Bookings and assignee

- `bookings.assigned_user_id` is a user id, or null (Unassigned). It can be the owner or an active member.
- New public bookings stay Unassigned.
- Anyone with `bookings.run` can set, change, or clear the name on a job that is not completed. Completed jobs keep the person who ran them.
- Status does not reset when the name changes.
- A removed person stays on past, completed, and cancelled jobs as a former label. Upcoming confirmed jobs are cleared to Unassigned.
- `bookings.created_by_user_id` is who created the appointment. The server sets it. It is not shown in the product. Removing a teammate does not clear it. Customer and system bookings stay null.

---

## Running a job

The hire acts as the shop. Money lands on the owner's Stripe account.

1. On the way → customer SMS from the shop
2. Job started → customer SMS from the shop
3. Work finished
4. Complete and collect pay

Two people tapping On the way at once: one wins, the other gets a conflict (`409`). Customer SMS uses the shop name. The rate limit is per signed-in user, so one busy bay does not burn the whole shop.

---

## Overlap

A team shop can have two jobs at the same time.

- Owner, coordinator, and manager create and reschedule may stack jobs. Heads-up only. Not a hard block.
- Public book, quote accept, and membership book still refuse a taken slot.
- Time off is shop closed, not one person's PTO.
- No capacity equal to the number of teammates. No per-person calendars.
- The same person on two overlapping jobs is allowed.

---

## Emails

| When                      | Who gets it   | Notes                                                                                           |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| Owner invites or resends  | Invite email  | Join link. 14-day expiry.                                                                       |
| Someone is assigned a job | That assignee | Email, in-app bell, and Expo push if they have the app. Not sent to the person who assigned it. |
| Member is removed         | None          | They are signed out.                                                                            |

Hires do not get a ping when a new booking comes in unassigned. They get one when a job is assigned to them.

---

## Removing someone

The owner removes them from Team. We do not delete the Auth user.

- `business_members.status` → `removed`
- Their accepted invite → `revoked` (a later invite reopens that row)
- Upcoming confirmed jobs they were on → Unassigned
- Past, completed, and cancelled keep their name
- Their sessions are signed out

After a new invite and accept, the same membership row becomes `active` again and takes the role on that invite.

---

## APIs

Auth is web cookies or `Authorization: Bearer <Supabase access_token>`.

| Method | Path                                      | Who               | What                                                                        |
| ------ | ----------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| GET    | `/api/team/members`                       | Owner             | Active members and pending invites                                          |
| PATCH  | `/api/team/members`                       | Owner             | `{ id, source, name?, role? }`. Updates the invite name, the role, or both. |
| POST   | `/api/team/invites`                       | Owner             | `{ email, name, role? }`. Send or resend.                                   |
| POST   | `/api/team/invites/accept`                | Signed-in invitee | `{ token }`. Join or rejoin. Copies the invite role.                        |
| POST   | `/api/team/remove`                        | Owner             | `{ id, source }`. Revoke a pending invite or remove an active member.       |
| GET    | `/api/availability/bookings`              | `bookings.read`   | List and calendar. `assignedToMe=true` filters to the signed-in user.       |
| GET    | `/api/availability/bookings/assignees`    | `bookings.read`   | Owner, active members, and former labels                                    |
| PATCH  | `/api/availability/bookings/:id/assignee` | `bookings.run`    | `{ assignedUserId }`                                                        |
| POST   | `/api/availability/bookings/:id/actions`  | `bookings.run`    | On the way, started, finished, complete                                     |

Create, edit, reschedule, cancel, and delete require `bookings.write` or `bookings.delete`, then write with the service role for that shop. A hire's session is not granted booking UPDATE or DELETE in the database.

Shop resolution is owned shop first, then an active membership. A route that still loads the shop as `business_profiles.profile_id = signed-in user` returns nothing for a hire. Collecting pay on a job uses the owner's Stripe account.

---

## Mobile

A hire logs in with the same account and works the owner's shop.

- Resolve owner shop or active membership. Do not send a hire through owner onboarding.
- Show the screens that role can open. Hide the rest.
- Show every job. “Assigned to me” is a filter.
- Anyone with `bookings.run` can run any job.
- Collect pay as the shop. Do not open Revenue or Stripe settings.
- Invite may omit `role`. Omitted means Member.
- If they were removed, they are not on the shop.

---

## Not in this feature

- Per-person calendars or a capacity count
- Treating the assignee as a lock
- Auto-claim on On the way
- A ping when a booking arrives unassigned
- Showing who created the appointment
- Letting a manager invite, remove, change roles, open billing, or open payouts
- Public customers double-booking a slot (staff may stack; the public calendar still blocks)
