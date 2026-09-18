# Team jobs — v1 (assignment, run, overlap)

Product overview (web + mobile context): [`TEAM_FEATURE.md`](./TEAM_FEATURE.md).

Put yourself in the shop: a booking comes in, someone has to do it, collect money, and go to the next car. The owner should not sit on the phone assigning every job. A teammate should not be able to rewrite the calendar or cancel someone else’s customer.

**Assignee is a label. It is not a lock.** Two people on a team is the common shop. A job comes in unassigned. Anyone on the shop can run it. Someone puts a name on it so the board stays organized. If that person is out sick, the other person still taps On the way. Do not hide the workflow because a name is on the card.

This is the recommended **v1**. Not Team billing. Not a manager role picker.

---

## Next slice (after login + view)

Access is done. Do **not** start with overlap or a permission matrix.

1. **Assignee on the appointment** — done (web). Hidden when the shop has no teammates.
2. **Open the job workflow to the shop** — web Complete + collect pay is open to teammates (`bookings.run`). On the way / Started / Finished stay on mobile for now.
3. **Still owner-only** — edit, cancel, delete, reschedule, create appointment, Settings, Payments, setup.

Overlap (two jobs at 10:00) is the slice after this one.

---

## What we already have

- Teammates log in and **see** Dashboard + Bookings. Reviews, Quotes, and Customers stay owner-only.
- They cannot edit, cancel, delete, reschedule, or open Settings / Payments / setup.
- Job flow already exists for the owner: On the way → Started → work finished → Complete + collect pay.
- The calendar still treats the shop as **one person**: a slot is blocked if any booking overlaps. That is the solo-owner model. A team shop needs more than one job at the same time.

---

## Questions and the best v1 answer

### 1. Do we assign people to appointments?

**Yes.** One optional `assigned_user_id` on the booking (owner or an active teammate).

Show it on the booking: name, or **Unassigned**.

Owner and any teammate can set or change the assignee. Do not make this owner-only or the owner babysits all day.

### 2. Who can run the job?

**Anyone on the shop** — owner or any active member — whether the job is assigned or not.

The name on the card answers “who’s supposed to have this.” It does not gate On the way. Alex is assigned and out sick → Jordan still runs it. Owner always can, including with no assignee.

Do not build “only the assignee can tap On the way.” That is the babysitter / sick-day trap.

### 3. What can they do when they run it?

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

**See all. Run all.** A “My jobs” filter is just a view of the label, not a permission.

Owner sees all and can do everything (run + edit + cancel).

### 7. Same time, same day — multiple jobs?

**Yes. The shop calendar must allow overlap.**

Public book still blocks a taken slot. Owner create and owner reschedule may stack jobs (heads-up only). Two bays / two people = two 10:00s.

v1 rules:

- **Shop hours** still apply (can’t book Tuesday if you’re closed).
- **Time off** still blocks the whole shop (shop is closed).
- **Another booking does not block the slot.** Public customers can pick a time that already has a job.
- Do **not** invent “capacity = number of teammates” in v1. Wrong number of people will be on, someone will call in sick, and you will fight the calendar. Unlimited concurrent in working hours is the simple team model.
- Later (not v1): warn if the **same person** is assigned two overlapping jobs. Still allow it (they can decline / owner reassigns).

Owner create and owner reschedule show a same-day / same-time heads-up. Do not hard-block.

### 8. Can a teammate collect payment if they can’t open Payments?

**Yes.** Collect-on-the-job is part of running the appointment. The Revenue / Stripe settings page stays owner-only.

---

## v1 build list (decent, not huge)

**This week, in order**

1. **`bookings.assigned_user_id`** — nullable. Must be the shop owner or an **active** member. New bookings stay `null` (Unassigned).
2. **Assign UI** — Unassigned + owner + each active teammate. Anyone on the shop can change it, any time (including after On the way). Owner can put their own name.
3. **List** — show the name on the card. Filter All | Mine | Unassigned is nice; not required to ship the field.
4. **`bookings.run` for every active member** — shop-wide, not “only if assigned to me.” Opens the existing job sheet. **Do not** grant `bookings.write`.
5. **Removed teammate** — they lose shop access. Clear assignee on **upcoming confirmed** jobs only. Past / completed / cancelled keep the name.

**Next week / after the above works**

6. **Overlap** — stop blocking a slot because another booking exists (`validateOwnerBookingSlot` + public book + quote accept + reschedule + maintenance). Hours + time off stay.

Out of v1: locking run to the assignee, auto-claim on On the way, Claim button, manager role, per-person calendars, capacity, Team plan, member create-appointment, member push on new bookings.

---

## Edge cases

| Situation                                                      | v1 behavior                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking comes in from the public page                          | Unassigned. Anyone on the shop can run it.                                                                                                                                                                                                                                                                        |
| Owner forgets to assign all week                               | Fine. Shop still works.                                                                                                                                                                                                                                                                                           |
| Assigned to Alex; Jordan opens it                              | Jordan can run it. Name stays Alex until someone changes it. Sick day works.                                                                                                                                                                                                                                      |
| Assigned to Alex; Alex is out sick                             | Leave the name or switch it to Jordan. Either way, Jordan taps On the way.                                                                                                                                                                                                                                        |
| Alex assigns the job to himself                                | Allowed. Same as owner assigning Alex. Owner assigning themselves is the same control.                                                                                                                                                                                                                            |
| Two people tap On the way at once                              | Existing race-safe status update: one wins, the other gets a conflict. No extra lock.                                                                                                                                                                                                                             |
| Owner is also detailing                                        | Assign the owner (`assigned_user_id` = owner user). Owner is not a `business_members` row.                                                                                                                                                                                                                        |
| Assigned member is removed from the team                       | They lose shop access. Auth user stays. Membership stays `removed`. Their accepted invite is revoked so a later invite can reuse that row. Upcoming confirmed jobs go Unassigned. Past / completed keep their name. Come-back requires a new invite. Reload shows “no longer on this team,” not owner onboarding. |
| Assigned member’s login is dead, customer is waiting           | Anyone still on the shop runs it. Change the name when you have a second.                                                                                                                                                                                                                                         |
| Reassign after On the way                                      | Anyone on the shop can change the name. Status does not reset.                                                                                                                                                                                                                                                    |
| Reassign after paid / completed                                | Allowed for the label; run actions stay off. History doesn’t change.                                                                                                                                                                                                                                              |
| Member tries Cancel / Edit / Reschedule / Delete               | Hidden + 403. Only owner.                                                                                                                                                                                                                                                                                         |
| Member tries to change price on the complete sheet             | Follow whatever the owner complete sheet already allows. Don’t add extra edit. If the sheet only collects pay, keep it that way.                                                                                                                                                                                  |
| Customer SMS (on my way, started, review)                      | Still sends as the shop. Member is not a second SMS identity.                                                                                                                                                                                                                                                     |
| Collect pay / tap to pay / invoice                             | Uses the shop’s Stripe. Member never sees payouts or Payment settings.                                                                                                                                                                                                                                            |
| Job already completed                                          | No more run actions. Same as owner.                                                                                                                                                                                                                                                                               |
| Public customer reschedules                                    | Keep the assignee. Time changed, person didn’t.                                                                                                                                                                                                                                                                   |
| Two jobs at 10:00, both unassigned                             | Both runnable. Put a name on one if you want the board tidy. Not required.                                                                                                                                                                                                                                        |
| Same person assigned two overlapping jobs                      | Allowed in v1. Add a warning later.                                                                                                                                                                                                                                                                               |
| Shop time off 12–1                                             | No new public bookings in that window. Existing jobs that already overlap time off stay (don’t auto-cancel).                                                                                                                                                                                                      |
| Buffer time between jobs                                       | Buffer vs _other bookings_ is a solo-calendar idea. Once overlap is allowed, buffer should not hide a slot just because another job exists. Buffer can stay as travel/setup on a _single_ job later.                                                                                                              |
| Solo shop, no teammates                                        | Assignee list is just the owner. Overlap still useful if they book two cars (helper, or they stack). If that feels wrong, overlap can be “only when the shop has ≥1 active member.” Prefer always-on overlap; owner can still pick another time.                                                                  |
| Member on Quotes / Reviews / Customers                         | Hidden + 403. Job contact still shows on the appointment.                                                                                                                                                                                                                                                         |
| Member opens any job                                           | Full read + full run sheet. Edit / cancel / reschedule still hidden.                                                                                                                                                                                                                                              |
| Demo / sample customer                                         | No change.                                                                                                                                                                                                                                                                                                        |
| First person taps On the way on an unassigned job              | Job runs. Name stays Unassigned unless someone sets it. No auto-claim in this slice.                                                                                                                                                                                                                              |
| Jordan changes Alex’s name on an in-progress job               | Allowed. It’s a label. Don’t fight it.                                                                                                                                                                                                                                                                            |
| Unassign mid-job                                               | Allowed. Status stays.                                                                                                                                                                                                                                                                                            |
| Pending invite (no login yet)                                  | Not in the assignee list. Assign after they accept.                                                                                                                                                                                                                                                               |
| Assignee has no display name                                   | Show email. Never a blank chip.                                                                                                                                                                                                                                                                                   |
| Owner’s “Mine” filter                                          | Jobs where `assigned_user_id` = owner. Not “everything.”                                                                                                                                                                                                                                                          |
| Page was open; someone changed the assignee                    | Run still works. Assignee is not re-checked for On the way.                                                                                                                                                                                                                                                       |
| Member removed while a payment is in flight                    | They lose the shop. Webhook still hits the owner’s Stripe. Owner finishes Complete if needed.                                                                                                                                                                                                                     |
| Time off on the calendar                                       | **Shop closed**, not “owner PTO.” Members cannot take public bookings in that window. Owner-only vacation while the team works = later (per-person calendars).                                                                                                                                                    |
| Owner is off, team is working, no time off set                 | Fine. Hours are shop hours.                                                                                                                                                                                                                                                                                       |
| Public calendar after overlap is on                            | Slots stay open even if 10:00 already has jobs. Shop can get slammed. Accept that in v1. Don’t add capacity.                                                                                                                                                                                                      |
| Free-tier lifetime booking cap                                 | Still applies. Team does not lift it. Overlap just means they can hit the cap faster.                                                                                                                                                                                                                             |
| Quote accepted / customer picks a time                         | New booking is Unassigned. Must use the same overlap rules (this path calls `validateOwnerBookingSlot` today).                                                                                                                                                                                                    |
| Maintenance / follow-up visit against the calendar             | Same overlap helper. Don’t leave this path blocking.                                                                                                                                                                                                                                                              |
| Public multi-service visit (one customer, two cars / two jobs) | One booking row, one assignee, for v1. Don’t invent per-line assignees.                                                                                                                                                                                                                                           |
| Customer confirmation / reminder SMS                           | Still shop name. Do **not** add “Alex is coming” in v1 (most jobs are unassigned at book time).                                                                                                                                                                                                                   |
| Nobody notices a new booking                                   | No member push in v1. They open Bookings. Owner keeps whatever notify they already have.                                                                                                                                                                                                                          |
| Booking request (old preferred-date inbox)                     | Members can **see** (read). Accept / decline stays owner (`bookings.write`). After accept → Unassigned.                                                                                                                                                                                                           |
| Complete sheet session fees (extra / tip)                      | Allowed. That is collect-on-the-job, not “edit the booking.” Catalog price stays.                                                                                                                                                                                                                                 |
| Complete with cash / Venmo / other                             | Works with no Stripe. Don’t block Complete if Connect isn’t ready.                                                                                                                                                                                                                                                |
| Card / invoice / Tap to Pay                                    | Same as owner today: needs the shop’s Stripe. Member never opens Payments settings.                                                                                                                                                                                                                               |
| Tap to Pay on the **member’s** phone                           | Must mint a connection token for the **owner’s** connected account. Today those routes look up the shop by `profile_id = me` and will 404 for a member. Fix or Tap to Pay is owner-only in practice.                                                                                                              |
| Two people start collect / two PaymentIntents                  | Existing job_completed + tap-to-pay idempotency. Second action 409. Don’t charge twice.                                                                                                                                                                                                                           |
| Membership-covered job                                         | Same close-out as owner. Member does not enroll or cancel memberships.                                                                                                                                                                                                                                            |
| Walk-up / Payments page charge                                 | Owner only. Not a booking.                                                                                                                                                                                                                                                                                        |
| SMS from member job actions                                    | Send as the shop. Rate limit stays **per signed-in user** (30/hr). Don’t require the owner’s user id or one busy bay burns the whole shop.                                                                                                                                                                        |
| Customer phone / address on the job                            | Stays on the appointment (booking row). Members do not get the Customers page.                                                                                                                                                                                                                                    |
| Dashboard home                                                 | Upcoming jobs: yes. Revenue / Stripe / upgrade / share-link: stay hidden (`payments.manage` / `profile.write`).                                                                                                                                                                                                   |
| Mobile Bearer token                                            | Same run rules as web. Don’t ship web-only.                                                                                                                                                                                                                                                                       |
| Cancelled / completed history                                  | Keep the assignee label. No run actions.                                                                                                                                                                                                                                                                          |
| Customer reschedules after assign                              | Keep assignee. Time changed, person didn’t.                                                                                                                                                                                                                                                                       |
| Member tries to accept a quote or reply to a review            | Still 403. Running jobs is the only new write.                                                                                                                                                                                                                                                                    |
| Solo shop, no teammates                                        | Hide the assignee dropdown. No one else to put on the job.                                                                                                                                                                                                                                                        |

---

## Code that will fail if we only change the UI

These are already in the repo. Fix them in the same week or “members can run jobs” is fake.

| Trap                                                             | What happens                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job actions require `bookings.write`                             | Members don’t have it. **Do not** grant `bookings.write` — that also unlocks cancel / edit / booking-request accept. Add `bookings.run` for every active member. Keep admin writes owner-only. |
| Bookings RLS is SELECT-only for members                          | Session `UPDATE` on `job_status` / `assigned_user_id` will fail. Narrow member UPDATE (status + assignee + complete fields) **or** admin client after the run/assign check.                    |
| Tap to Pay auth uses `business_profiles.profile_id = auth.uid()` | Member 404s. Resolve the shop the same way as the dashboard (owned **or** active membership).                                                                                                  |
| Overlap lives in more than the bookings list                     | Later slice. `validateOwnerBookingSlot` + `slotGeneration` + quote accept + public book + maintenance.                                                                                         |

---

## Why this is the teammate-shaped v1

A hired detailer needs three things: **see the board**, **do the next car**, **get paid**. The name on the job is so the two-person shop knows who has which car. It is not a permission.

Owner babysitting is optional (put a name on it when you care). Sick days stay simple because the workflow stays open. Overlap is the slice after assignee + run actually work.
