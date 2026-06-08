# Admin email update (support)

Use this when a customer signed up with a **typo'd email** they cannot access. They miss booking notifications and cannot complete app signup. Supabase Dashboard does not offer a simple “edit email” UI for existing users, and in-app self-service email change is **not** supported (Supabase “secure email change” requires confirmation links to **both** old and new inboxes — useless when the old address is wrong).

**Fix:** run the admin script against production with the service role key. It updates `auth.users` immediately via `updateUserById` with `email_confirm: true`. Password is unchanged.

---

## Prerequisites

In `.env.local` (or your shell env when running against prod):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

---

## Steps

1. **Identify the user** in Supabase Dashboard → Authentication → Users (user id + current typo email).
2. **Dry-run** (optional):

   ```bash
   npm run script:update-user-email -- --user-id <uuid> --email correct@example.com --dry-run
   ```

3. **Apply**:

   ```bash
   npm run script:update-user-email -- --user-id <uuid> --email correct@example.com
   ```

   Or look up by current email:

   ```bash
   npm run script:update-user-email -- --from typo@example.com --email correct@example.com
   ```

4. **Tell the customer** to sign in with the **new** email and their **existing password**. Booking/account emails go to the new address (check spam once).

---

## Example (Jun 2025)

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| User id       | `be920c8b-02fa-44da-8509-48401f796609` |
| Typo email    | `ocobiesfullblast@icloud.com`          |
| Correct email | `cobiefullblast@icloud.com`            |
| Business      | Cobie's Full Blast Detailing and more  |

Command used:

```bash
npm run script:update-user-email -- --user-id be920c8b-02fa-44da-8509-48401f796609 --email cobiefullblast@icloud.com
```

---

## Code locations

| Piece         | Path                                                           |
| ------------- | -------------------------------------------------------------- |
| CLI script    | `scripts/update-user-email.ts`                                 |
| Server helper | `src/features/account/server/updateAccountEmailAdmin.ts`       |
| Tests         | `src/features/account/testing/updateAccountEmailAdmin.test.ts` |
| npm script    | `npm run script:update-user-email`                             |

---

## Notes

- Emails are stored **lowercase** in auth (`Cobiefullblast@iCloud.com` → `cobiefullblast@icloud.com`). iCloud treats them the same.
- **Stripe billing email** is separate. If receipts still go to the old address, update the Stripe customer email in Dashboard or via API using `stripe_customer_id` on `profiles`.
- **Google OAuth users:** email is managed by Google; this script is for email/password (`provider === 'email'`) accounts only.
- Do **not** use raw SQL on `auth.users` unless the Admin API fails — prefer the script.
