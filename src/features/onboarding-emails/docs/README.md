# Onboarding emails

Lifecycle emails from Mark at ServiceLink. Unfinished setup gets two notes, then that track stops. A finished owner with no bookings gets “Book your first appointment,” then one last receipt-and-review note. The morning after their first booking, they get one note to grab the free QR code in the mobile app. That is the last email. Every note uses `owner_lifecycle_emails` and the same daily job.

## What the cron does

Vercel calls `GET /api/internal/cron/onboarding-emails` once a day at 14:00 UTC, about 8am Chicago, with the other cron jobs.

The job is on by default. Flip `SETUP_EMAILS_ENABLED` in `constants.ts` to stop it.

Each run looks at owners who signed up in the last 14 days and have not finished setup. It walks oldest first.

- The first morning that is at least a day after signup, they get “Your booking page is one step away.” The button opens `/dashboard`.
- Three days after that email was sent, if they are still unfinished, they get one last note. Never on the same Chicago day as the first.
- A finished owner is not selected, so that track never starts.

The same run also looks for owners who finished at least a day ago and still have no bookings. They get “Book your first appointment.” Three days after that email, if the calendar is still empty, they get one last note about the receipt and the review request. Any booking skips whichever of those notes has not gone out. Both buttons open that owner’s public booking page with `?practice=1`, which starts the booking coach. No login.

The morning that is at least a day after their first booking, finished owners get one note about the free QR code in the app. It does not include a QR image. The buttons open the App Store and Google Play. Then this track stops.

Finishing setup still sends the separate “you’re live” email immediately. That email does not ask them to book.

One run sends at most 40 of these, 5 at a time. That cap is what keeps a busy morning from trying to mail everyone in a single invocation and timing out. People past the cap stay due, and the next morning continues with the oldest who still need a note.

Before each send, the job inserts a row in `owner_lifecycle_emails`. If Resend rejects the send, that row is deleted so the next morning can try again. A second run cannot send the same note while the row is there.

These notes send from `Mark from ServiceLink <mark@team.myservicelink.app>`. Booking emails stay on `RESEND_FROM_EMAIL`. Replies go to `support@myservicelink.app`. Addresses on `@myservicelink.app` are skipped.

`?dryRun=1` reports who would get mail and sends nothing. Add `userId` to limit the run to one owner. `force=1` only works with `userId`: it sends the next unsent note now, and still writes the row so the morning job will not send that note again.

```bash
curl -sS "http://localhost:3000/api/internal/cron/onboarding-emails?dryRun=1&userId=USER_ID&force=1" \
  -H "x-internal-push-secret: $INTERNAL_PUSH_API_SECRET"
```

Drop `dryRun=1` to send that one email. Leave off `userId` only for the real daily run.

## What gets stored

```sql
-- src/features/onboarding-emails/docs/001_setup_emails.sql
```

| Column      | Meaning                                 |
| ----------- | --------------------------------------- |
| `user_id`   | The owner                               |
| `email_key` | Which note, such as `A1_setup_one_step` |
| `sent_at`   | When this run claimed it                |

The primary key is `(user_id, email_key)`. One row per note. Adding a later note is a new key in code, not a new column.

## This track

- [x] Come back and finish
- [x] Book your first appointment the morning after setup, only when they have no bookings
- [x] One last receipt-and-review note three days later, only if they still have no bookings
- [x] The morning after the first booking, one note: download the app and get the free QR code for cards, van, and flyers
