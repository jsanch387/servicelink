# Mobile onboarding (temporary)

Handoff for the first mobile version of the new setup. Delete this when the app has shipped it.

The website coach already exists. The app does not rebuild it. Open the public booking page and the website turns the coach on.

## First version

1. A new account is created in the app.
2. When their booking page is ready, show **You’re live**.
3. **Book a test appointment** opens `https://myservicelink.app/{slug}?practice=1`.
4. **Skip for now** goes home. Home shows the same button until any appointment exists.
5. After any booking, the home button goes away.

Do not build yet: the phone checklist, the calendar walkthrough after the practice booking, the “get the app” modal, or the lifecycle emails. The server already sends the emails.

## You’re live

Show this once, at the end of signup, when the booking page exists.

- Title: **You’re live**
- Body: **Your booking page is ready to take bookings.**
- Primary button: **Book a test appointment**
- Text button: **Skip for now**

Both buttons do one thing. Book opens the URL below. Skip goes to the home screen. Skip does not write a row. “Has not booked yet” is the skipped state.

## Home

Show one button, **Book a test appointment**, and nothing else from this feature.

Show it only when all of these are true:

- This person is the owner, not a team member.
- `profiles.onboarding_completed_at` is set.
- This shop has no row in `bookings`.

Hide it after the first appointment and do not show it again. Any appointment counts, including the practice one. Do not read an `is_test` flag.

## Booking link

```text
https://myservicelink.app/{business_slug}?practice=1
```

`business_slug` is `business_profiles.business_slug`. Open the URL in the browser or an in-app web view.

`practice=1` starts the website coach, then the site removes the parameter. The coach is kept in the browser for that visit. It is not stored in the database. The app does not draw the coach.

The server treats the first public booking on that page as the practice appointment. The app does not send a test flag.

## Where the rows are

| What         | Where                                               |
| ------------ | --------------------------------------------------- |
| Account      | `profiles.user_id` matches the auth user            |
| Shop         | `business_profiles.profile_id` = `profiles.user_id` |
| Link         | `business_profiles.business_slug`                   |
| Appointments | `bookings.business_id` = `business_profiles.id`     |

Home button check:

```sql
select exists (
  select 1
  from public.bookings b
  where b.business_id = :business_id
) as has_booking;
```

`:business_id` is `business_profiles.id`, not the auth user id.

## What to write

### Signup source

`profiles.signup_platform` is `web`, `ios`, or `android`. No other value.

Write it once, from the signup success path, and only when it is still empty.

```sql
update public.profiles
set signup_platform = 'ios' -- 'android' on Android
where user_id = :user_id
  and signup_platform is null;
```

Do not run this on login or on a later app open. Someone who signed up on the website and later opens the app must stay `web`. The website uses that column to hide the app-download modal.

On that same signup, if `onboarding_flow` is still empty, set it to `v3`. A database trigger may already insert the profile as `v3` when the email is confirmed. Do not change a flow that is already set.

### You’re live

When the app reaches that screen, mark setup finished. The morning emails use the timestamp.

```sql
update public.profiles
set
  onboarding_status = 'completed',
  onboarding_completed_at = coalesce(onboarding_completed_at, now())
where user_id = :user_id;
```

The app does not send the “you’re live” email. The server does that.
