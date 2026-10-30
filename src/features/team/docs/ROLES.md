# Team roles (plan)

Working definition of who can do what on a Team shop. Not shipped. Today every hire is a member. See [`TEAM_FEATURE.md`](./TEAM_FEATURE.md) for current behavior.

The owner assigns every role. No one else can invite, remove, or change a role.

---

## Roles

Four roles. The owner is the account that created the shop and is never a row in `business_members`. The other three are hired roles the owner picks on invite and can change later on the Team page.

| Product name | Stored role | Who it is |
| --- | --- | --- |
| Owner | `owner` | Created the shop. Not assignable. |
| Member | `member` | Does the job. Sees the board, runs appointments, collects pay, reassigns. Does not move the calendar. Default for new invites and for everyone already on a team. |
| Coordinator | `coordinator` | Keeps the book. Same as Member, plus new appointments, reschedule, cancel, delete, and accept requests. |
| Manager | `manager` | Runs the office day to day. Same calendar access as a Coordinator, plus customers, quotes, invoices, expenses, reviews, and shop setup. |

A `manager` key already exists in `ROLE_PERMISSIONS` and is unused in the product. This plan replaces that bundle. Do not ship the current code map as-is: it skips expenses and treats delete-appointment as part of `bookings.write`.

---

## Who gets which role

| Request | Role |
| --- | --- |
| Hire who only completes appointments | Member |
| Employee who gets a job and needs to schedule or reschedule it | Coordinator |
| Partner who needs to see every booking and adjust it | Coordinator |
| Trusted partner who should run the shop without owning billing, payouts, the team, or the account | Manager |

---

## Permissions

Check a capability (`can(ctx, 'bookings.write')`). Do not check `role === 'member'` in product code.

`bookings.delete` is new. It does not exist in `TEAM_PERMISSIONS` yet. Today, delete sits inside `bookings.write`.

| Permission | What it allows |
| --- | --- |
| `dashboard.read` | Open the shop home |
| `bookings.read` | See every job on the board and in the job sheet. Not only jobs assigned to them. |
| `bookings.run` | On the way, started, finished, complete, collect pay on that job, change assignee. Shop-wide. Assignee is not a lock. |
| `bookings.write` | New appointment, edit details, reschedule, cancel, accept a booking request |
| `bookings.delete` | Permanently delete an appointment |
| `customers.read` / `customers.write` | Customers page |
| `quotes.read` / `quotes.write` | Quotes |
| `invoices.read` / `invoices.write` | Invoices |
| `expenses.read` / `expenses.write` | Expenses |
| `reviews.read` / `reviews.write` | Reviews |
| `profile.write` | Booking page content |
| `services.write` | Services catalog |
| `availability.write` | Shop hours and time off |
| `marketing.write` | Marketing |
| `payments.manage` | Revenue, Stripe settings, payouts, walk-up charges that are not on a job |
| `billing.manage` | Plan and subscription |
| `team.manage` | Invite, remove, and change roles |
| `account.delete` | Delete the account and the shop |

Collecting pay on a job is `bookings.run`. Opening Revenue or Stripe is `payments.manage`.

Editing the booking page is `profile.write`. Deleting the account is `account.delete`. A manager can edit the page. Only the owner can delete the account.

---

## Who has what

Yes means the role includes that permission.

| Permission | Member | Coordinator | Manager | Owner |
| --- | --- | --- | --- | --- |
| `dashboard.read` | Yes | Yes | Yes | Yes |
| `bookings.read` | Yes | Yes | Yes | Yes |
| `bookings.run` | Yes | Yes | Yes | Yes |
| `bookings.write` | | Yes | Yes | Yes |
| `bookings.delete` | | Yes | Yes | Yes |
| `customers.read` | | | Yes | Yes |
| `customers.write` | | | Yes | Yes |
| `quotes.read` | | | Yes | Yes |
| `quotes.write` | | | Yes | Yes |
| `invoices.read` | | | Yes | Yes |
| `invoices.write` | | | Yes | Yes |
| `expenses.read` | | | Yes | Yes |
| `expenses.write` | | | Yes | Yes |
| `reviews.read` | | | Yes | Yes |
| `reviews.write` | | | Yes | Yes |
| `profile.write` | | | Yes | Yes |
| `services.write` | | | Yes | Yes |
| `availability.write` | | | Yes | Yes |
| `marketing.write` | | | Yes | Yes |
| `payments.manage` | | | | Yes |
| `billing.manage` | | | | Yes |
| `team.manage` | | | | Yes |
| `account.delete` | | | | Yes |

### Member — `member`

`dashboard.read`, `bookings.read`, `bookings.run`.

### Coordinator — `coordinator`

Member, plus `bookings.write` and `bookings.delete`.

### Manager — `manager`

Coordinator, plus `bookings.delete`, customers, quotes, invoices, expenses, reviews, `profile.write`, `services.write`, `availability.write`, `marketing.write`.

### Owner — `owner`

Every permission. The owner is not stored on `business_members`. `isOwner` still grants everything, including permissions added later.

---

## Owner only

These four stay with the owner. Manager does not get them.

| Permission | Why it stays with the owner |
| --- | --- |
| `account.delete` | Closes the account and deletes the shop |
| `billing.manage` | Plan, upgrade, and subscription |
| `payments.manage` | Stripe, payouts, and payment settings |
| `team.manage` | Who is on the team, and which role they have |

A manager who could remove people or change roles would be a second owner. Team control can be opened later if shops ask for it.

---

## How the owner assigns a role

- Invite asks for name, email, and role. Default is Member.
- The invite stores the role. Accept writes that role onto `business_members`.
- The owner can change an active member’s role from the Team page. No new invite.
- Pending invites show the role the owner picked. The owner can change it before accept.
- Existing members stay Member until the owner changes them.

Sidebar and APIs follow the permission table. A screen the role cannot open returns 403. Mobile uses the same permissions.

---

## First chunk: Coordinator

Member already works. This chunk adds Coordinator only. Manager stays out of the product until the next chunk.

Permissions stay a map in code (`ROLE_PERMISSIONS`). The database stores the role string. It does not store a permission row per person.

### Database

One migration: [`migrations/008_team_roles.sql`](./migrations/008_team_roles.sql). No new tables. No write policies.

`business_members.role` already exists and defaults to `member`. Add the same column to invites, and constrain both:

| Table | Change |
| --- | --- |
| `team_invites` | `role text not null default 'member'` |
| `team_invites.role` and `business_members.role` | Allowed values: `member`, `coordinator`, `manager` |

Existing rows stay `member`. `manager` is allowed in the database now so the next chunk does not need another constraint. The invite can store Manager. Office access for that role is still the next chunk.

Booking reads already work for any active teammate. Do not add update or delete policies for teammates. Create-appointment already writes with the service role. Reschedule and cancel still write with the signed-in user’s client, and those policies are owner-only. After `bookings.write` passes, those two writes use the service role, scoped to that shop. Delete uses the service role after `bookings.delete` passes, still scoped to that shop.

### Code

- Add `coordinator` to the permission map: Member’s permissions plus `bookings.write`.
- `bookings.delete` is separate from `bookings.write`. Coordinator and the owner have it. Member does not. Hide delete unless that permission is present.
- `resolveDashboardContext` must keep `coordinator`. Today any role other than `manager` is treated as Member.
- Invite body gains `role`, default `member`. Store it on `team_invites`. Accept copies it onto `business_members`. Rejoining also updates the role. Today rejoin only flips `status` back to `active` and would leave the old role in place.
- Team list shows the role. The owner can change it on a pending invite or an active member. People already on the team can become Coordinators without a new invite.
- New appointment, reschedule, cancel, and accept-request follow `bookings.write`. They appear for Coordinator and stay hidden for Member.
- `POST /api/public/bookings` with `ownerManualBooking` must require `bookings.write`. Today it only checks that the person belongs to the shop, and a Member already belongs to the shop.
- Mobile invite may omit `role`. Omitted means Member. Web sends the role the owner picked.

### Left for Manager

Office pages, `bookings.delete` for Manager, and the Manager option on invite. Office SELECT stays owner-only until then.
