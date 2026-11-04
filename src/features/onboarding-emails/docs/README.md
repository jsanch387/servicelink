# Onboarding emails

Setup emails from Mark at ServiceLink. This folder is only the first track: an owner who signs up and does not finish. Two notes, then this track stops.

Later tracks (test appointment, first customer booking) are not built yet. They will use the same `owner_lifecycle_emails` table and the same daily job.

## What the cron does

Vercel calls `GET /api/internal/cron/onboarding-emails` once a day at 14:00 UTC, about 8am Chicago, with the other cron jobs.

The job is on by default. Flip `SETUP_EMAILS_ENABLED` in `constants.ts` to stop it.

Each run looks at owners who signed up in the last 14 days and have not finished setup. It walks oldest first.

- The first morning that is at least a day after signup, they get “Your booking page is one step away.” The button opens `/dashboard`.
- Three days after that email was sent, if they are still unfinished, they get one last note. Never on the same Chicago day as the first.
- A finished owner is not selected, so the track never starts.

One run sends at most 40 of these, 5 at a time. That cap is what keeps a busy morning from trying to mail everyone in a single invocation and timing out. People past the cap stay due, and the next morning continues with the oldest who still need a note.

Before each send, the job inserts a row in `owner_lifecycle_emails`. If Resend rejects the send, that row is deleted so the next morning can try again. A second run cannot send the same note while the row is there.

The sender is the existing `RESEND_FROM_EMAIL`. Replies go to `support@myservicelink.app`. Addresses on `@myservicelink.app` are skipped.

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

| Column | Meaning |
| --- | --- |
| `user_id` | The owner |
| `email_key` | Which note, such as `A1_setup_one_step` |
| `sent_at` | When this run claimed it |

The primary key is `(user_id, email_key)`. One row per note. Adding a later note is a new key in code, not a new column.

## Still to build

- [x] Come back and finish
- [ ] Book a test appointment, after setup, and only when they have no bookings
- [ ] Share-the-link notes while they still have no customer booking on the public page
- [ ] One note when the first customer books on the public page
