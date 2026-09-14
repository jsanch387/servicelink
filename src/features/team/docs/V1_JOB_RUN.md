# Team jobs — v1 (assignment, run, overlap)

Put yourself in the shop: a booking comes in, someone has to do it, collect money, and go to the next car. The owner should not sit on the phone assigning every job. A teammate should not be able to rewrite the calendar or cancel someone else’s customer.

This is the recommended **v1**. Not Team billing. Not a manager role picker. Not job assignees as a marketing feature.

---

## What we already have

- Teammates log in and **see** the shop (Dashboard, Bookings, Customers, Quotes, Reviews).
- They cannot edit, cancel, delete, reschedule, or open Settings / Payments / setup.
- Job flow already exists for the owner: On the way → Started → work finished → Complete + collect pay.
- The calendar still treats the shop as **one person**: a slot is blocked if any booking overlaps. That is the solo-owner model. A team shop needs more than one job at the same time.

---

## Questions and the best v1 answer

### 1. Do we assign people to appointments?

**Yes.** One optional `assigned_user_id` on the booking (owner or an active teammate).

Show it on the booking: name, or **Unassigned**.

Owner and any teammate can set or change the assignee. Do not make this owner-only or the owner babysits all day.

### 2. If nobody is assigned, who can run the job?

**Anyone on the shop** — owner or any active member.

Assignment is “who’s on this,” not a lock. If you require assign-before-run, every public booking sits dead until the owner taps someone. That is babysitting.

When it **is** assigned: **that person + the owner** can run it (status, collect pay). Other teammates still **see** it. They cannot tap On the way / Complete / Collect.

Owner always can run every job. They also work cars.

### 3. What can the assigned person (or anyone, if unassigned) do?

Same job sheet the owner uses today:

- On the way (customer SMS)
- Job started (customer SMS)
- Work finished
- Complete + collect payment (card, tap to pay, invoice — existing shop Stripe)

They are acting **as the shop**. Money still lands on the owner’s Connect. They do **not** need the Payments page or `payments.manage`.

### 4. What can they never do? (even if assigned)

- Edit the booking (service, price, add-ons, address, customer)
- Cancel
- Delete
- Reschedule
- Create a new appointment from the dashboard (v1)
- Change availability, services, booking link, team, billing

Owner keeps those.

If you need a name for this later: `bookings.run` (job + pay) vs `bookings.admin` (edit / cancel / move). Do not reuse “member can write bookings” for cancel.

### 5. Does the owner have to assign every inbound booking?

**No.** New bookings stay **Unassigned**. First person who is free opens it and runs it — or assigns themselves / a coworker if they want the list to stay tidy.

Assignment is a convenience, not a gate.

### 6. Does a teammate see every job or only theirs?

**See all. Act on unassigned + mine.**

A detailer needs the board: who is next, who is stacked, who might need help. A “My jobs” filter is enough. Hiding the rest of the day makes the shop dumber.

Owner sees all and can act on all.

### 7. Same time, same day — multiple jobs?

**Yes. The shop calendar must allow overlap.**

Today a second booking at the same time is blocked (public book + owner reschedule). That is one-person thinking. Two bays / two people = two 10:00s.

v1 rules:

- **Shop hours** still apply (can’t book Tuesday if you’re closed).
- **Time off** still blocks the whole shop (shop is closed).
- **Another booking does not block the slot.** Public customers can pick a time that already has a job.
- Do **not** invent “capacity = number of teammates” in v1. Wrong number of people will be on, someone will call in sick, and you will fight the calendar. Unlimited concurrent in working hours is the simple team model.
- Later (not v1): warn if the **same person** is assigned two overlapping jobs. Still allow it (they can decline / owner reassigns).

Owner “create appointment” already has a soft double-book warning. Keep a warning; do not hard-block.

### 8. Can a teammate collect payment if they can’t open Payments?

**Yes.** Collect-on-the-job is part of running the appointment. The Revenue / Stripe settings page stays owner-only.

---

## v1 build list (decent, not huge)

1. **`bookings.assigned_user_id`** — nullable, `auth.users`, must be the shop owner or an **active** member of that shop.
2. **Assign UI** on the booking — Unassigned + owner + each active teammate. Owner and members can change it.
3. **Run permission** — new `bookings.run`, not `bookings.write`. Owner always; else (unassigned OR `assigned_user_id = me`) AND active member. Hide On the way / Started / Complete / Collect when they can’t run. APIs 403 the same way. Cancel / edit / delete / reschedule stay owner-only.
4. **List** — show assignee on the card. Filter: All | Mine | Unassigned.
5. **Overlap** — stop treating “another booking at this time” as unavailable. Same change in every path that uses `validateOwnerBookingSlot` / `bookingOverlapsExistingBookings` (public book, public quote accept, owner reschedule, maintenance calendar). Keep hours + time off.
6. **Removed teammate** — if they are assigned and then removed, clear `assigned_user_id` (job goes Unassigned). Owner can still run it.
7. **First run claims it** — first On the way / Started on an **unassigned** job writes `assigned_user_id = me`. Cheap claim. No extra button.
8. **Reassign rules** — anyone can assign an **unassigned** job. Once assigned, only the current assignee + owner can change it (stops Jordan stealing Alex’s car mid-job).

Out of v1: manager role, separate Claim button, per-person calendars, “max jobs at once,” assigning a pending invite, Team plan, member create-appointment, member push on new bookings.

---

## Edge cases

| Situation | v1 behavior |
| --------- | ----------- |
| Booking comes in from the public page | Unassigned. Anyone on the shop can run it. |
| Owner forgets to assign all week | Fine. Shop still works. |
| Assigned to Alex; Jordan opens it | Jordan can read. Jordan cannot run. Owner can run or reassign. |
| Alex assigns the job to himself | Allowed. Same as owner assigning Alex. |
| Two people tap On the way at once | Existing race-safe status update: one wins, the other gets a conflict. No extra lock. |
| Owner is also detailing | Assign the owner (`assigned_user_id` = owner user). Owner is not a `business_members` row. |
| Assigned member is removed from the team | Assignee cleared. Job is Unassigned. They lose shop access. |
| Assigned member’s login is dead, customer is waiting | Owner (or anyone if you cleared assign) runs it. Don’t lock a job to a ghost. |
| Reassign after On the way | Allowed. New person + owner continue from current status. Don’t reset the job. |
| Reassign after paid / completed | Allowed for the label; run actions stay off. History doesn’t change. |
| Member tries Cancel / Edit / Reschedule / Delete | Hidden + 403. Only owner. |
| Member tries to change price on the complete sheet | Follow whatever the owner complete sheet already allows. Don’t add extra edit. If the sheet only collects pay, keep it that way. |
| Customer SMS (on my way, started, review) | Still sends as the shop. Member is not a second SMS identity. |
| Collect pay / tap to pay / invoice | Uses the shop’s Stripe. Member never sees payouts or Payment settings. |
| Job already completed | No more run actions. Same as owner. |
| Public customer reschedules | Keep the assignee. Time changed, person didn’t. |
| Two jobs at 10:00, both unassigned | Both runnable. First person should assign themselves so the other isn’t stolen mid-job — social, not a lock. Optional later: “I’m on this” claims it. |
| Same person assigned two overlapping jobs | Allowed in v1. Add a warning later. |
| Shop time off 12–1 | No new public bookings in that window. Existing jobs that already overlap time off stay (don’t auto-cancel). |
| Buffer time between jobs | Buffer vs *other bookings* is a solo-calendar idea. Once overlap is allowed, buffer should not hide a slot just because another job exists. Buffer can stay as travel/setup on a *single* job later. |
| Solo shop, no teammates | Assignee list is just the owner. Overlap still useful if they book two cars (helper, or they stack). If that feels wrong, overlap can be “only when the shop has ≥1 active member.” Prefer always-on overlap; owner can still pick another time. |
| Member on Quotes / Reviews / Customers | Unchanged: read-only. Running jobs is the only new write. |
| Member opens a job they can’t run | Full read (customer, address, notes, status). Actions hidden. Don’t show a dead Complete button. |
| Demo / sample customer | No change. |
| First person taps On the way on an unassigned job | Auto-assign them. Second person now read-only. Status does not reset if they later reassign. |
| Jordan reassigns Alex’s in-progress job to himself | Blocked. Only Alex or the owner can change assignee once it is set. |
| Unassign mid-job (back to Unassigned) | Owner + current assignee only. Status stays. Anyone can run it again. |
| Pending invite (no login yet) | Not in the assignee list. Assign after they accept. |
| Assignee has no display name | Show email. Never a blank chip. |
| Owner’s “Mine” filter | Jobs where `assigned_user_id` = owner. Not “everything.” |
| Page was open; owner assigned it to someone else; member taps On the way | Re-check assignee **on the API**, not the stale UI. 403 + refresh. |
| Member removed while a payment is in flight | They lose the shop. Webhook still hits the owner’s Stripe. Owner finishes Complete if needed. |
| Time off on the calendar | **Shop closed**, not “owner PTO.” Members cannot take public bookings in that window. Owner-only vacation while the team works = later (per-person calendars). |
| Owner is off, team is working, no time off set | Fine. Hours are shop hours. |
| Public calendar after overlap is on | Slots stay open even if 10:00 already has jobs. Shop can get slammed. Accept that in v1. Don’t add capacity. |
| Free-tier lifetime booking cap | Still applies. Team does not lift it. Overlap just means they can hit the cap faster. |
| Quote accepted / customer picks a time | New booking is Unassigned. Must use the same overlap rules (this path calls `validateOwnerBookingSlot` today). |
| Maintenance / follow-up visit against the calendar | Same overlap helper. Don’t leave this path blocking. |
| Public multi-service visit (one customer, two cars / two jobs) | One booking row, one assignee, for v1. Don’t invent per-line assignees. |
| Customer confirmation / reminder SMS | Still shop name. Do **not** add “Alex is coming” in v1 (most jobs are unassigned at book time). |
| Nobody notices a new booking | No member push in v1. They open Bookings. Owner keeps whatever notify they already have. |
| Booking request (old preferred-date inbox) | Members can **see** (read). Accept / decline stays owner (`bookings.write`). After accept → Unassigned. |
| Complete sheet session fees (extra / tip) | Allowed. That is collect-on-the-job, not “edit the booking.” Catalog price stays. |
| Complete with cash / Venmo / other | Works with no Stripe. Don’t block Complete if Connect isn’t ready. |
| Card / invoice / Tap to Pay | Same as owner today: needs the shop’s Stripe. Member never opens Payments settings. |
| Tap to Pay on the **member’s** phone | Must mint a connection token for the **owner’s** connected account. Today those routes look up the shop by `profile_id = me` and will 404 for a member. Fix or Tap to Pay is owner-only in practice. |
| Two people start collect / two PaymentIntents | Existing job_completed + tap-to-pay idempotency. Second action 409. Don’t charge twice. |
| Membership-covered job | Same close-out as owner. Member does not enroll or cancel memberships. |
| Walk-up / Payments page charge | Owner only. Not a booking. |
| SMS from member job actions | Send as the shop. Rate limit stays **per signed-in user** (30/hr). Don’t require the owner’s user id or one busy bay burns the whole shop. |
| Customer phone / address on the job | Members already have `customers.read`. They need it to drive and text. Don’t hide it. |
| Dashboard home | Upcoming jobs: yes. Revenue / Stripe / upgrade / share-link: stay hidden (`payments.manage` / `profile.write`). |
| Mobile Bearer token | Same run rules as web. Don’t ship web-only. |
| Cancelled / completed history | Keep the assignee label. No run actions. |
| Customer reschedules after assign | Keep assignee. Time changed, person didn’t. |
| Member tries to accept a quote or reply to a review | Still 403. Running jobs is the only new write. |
| Solo shop, no teammates | Assignee list is just the owner. Overlap still on (two cars). Hide the assign chip if you want less noise — optional. |

---

## Code that will fail if we only change the UI

These are already in the repo. Fix them in the same week or “members can run jobs” is fake.

| Trap | What happens |
| ---- | ------------ |
| Job actions require `bookings.write` | Members don’t have it. **Do not** grant `bookings.write` — that also unlocks cancel / edit / booking-request accept. Add `bookings.run` (or a per-booking check) and keep admin writes owner-only. |
| Bookings RLS is SELECT-only for members | Session `UPDATE` on `job_status` / `assigned_user_id` will fail. Need a narrow member UPDATE (status + assignee + complete fields) **or** admin client after the run check. |
| Tap to Pay auth uses `business_profiles.profile_id = auth.uid()` | Member 404s. Resolve the shop the same way as the dashboard (owned **or** active membership). |
| Overlap lives in more than the bookings list | `validateOwnerBookingSlot` + `slotGeneration` + quote accept + public book + maintenance. Miss one and customers still see “that time was just booked.” |
| Stale UI | Permission is decided again on every action POST, including assign. |

---

## Why this is the teammate-shaped v1

A hired detailer needs three things: **see the board**, **do the next car**, **get paid**. They should not wait on the owner to “release” a job, and they should not be able to nuke the calendar.

Owner babysitting is optional organization (assign when you care), not a required step. Overlap is what makes a second pair of hands real. Everything else (claim, capacity, same-person warning) can wait until a shop actually hits it.
