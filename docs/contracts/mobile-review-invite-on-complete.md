# Contract: Mobile — Review invite email after completing a booking

Use this when the **signed-in business owner** marks an availability booking **completed** from the native app.

**Mobile owns the booking update.** Update `bookings.status = 'completed'` directly in Supabase (owner RLS). The **only** server call for reviews is to **send the invite email** — mobile cannot call Resend.

**Do not** use a server endpoint to mark the booking complete. Use:

| Method | Path                                                   | Purpose                                                  |
| ------ | ------------------------------------------------------ | -------------------------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/review-invite` | Create invite row + send email (after Supabase complete) |

**Implementation**

| Piece                            | Path                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| Review invite API                | `src/app/api/availability/bookings/[id]/review-invite/route.ts` |
| Server helper                    | `src/features/reviews/server/requestReviewInviteForBooking.ts`  |
| Eligibility (client-side mirror) | `src/features/reviews/server/reviewInviteEligibility.ts`        |

---

## When to call the API

1. Booking **`status`** was successfully updated to **`completed`** in Supabase.
2. **`willSendReviewInviteOnComplete`** is `true` (computed from Supabase reads — see **How we decide if the review email is needed**).

Do **not** call before the booking is completed — server returns **400**.

If eligibility is false, **skip the API call** entirely.

---

## Endpoint

|                  |                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| **Method**       | `POST`                                                                          |
| **Path**         | `/api/availability/bookings/{bookingId}/review-invite`                          |
| **Request body** | None                                                                            |
| **Example**      | `POST https://<api-origin>/api/availability/bookings/{bookingId}/review-invite` |

---

## Authentication (required)

| Header          | Value                                           |
| --------------- | ----------------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>`        |
| `Content-Type`  | `application/json` (optional; no body required) |

Same JWT the Expo app already uses for other owner dashboard API routes.

**Behavior:** Server resolves the signed-in user → `business_profiles.id` for that owner. Booking must belong to that **`business_id`** (RLS + explicit check). Wrong/missing auth → **401**. Booking not found for owner → **404**.

**Never** send the Supabase **service role** key from mobile.

---

## How we decide if the review email is needed (read from Supabase)

**There is no server “preview” endpoint for mobile.** Web and mobile use the **same rules**; web loads them when listing bookings (`loadReviewInviteEligibilityContext` in `reviewInviteEligibility.ts`). **Mobile reads the same tables directly** with the owner Supabase client (RLS).

You need **two separate decisions** — same as web dashboard:

| Decision                    | Used for                            | Rule                                   |
| --------------------------- | ----------------------------------- | -------------------------------------- |
| **Modal copy**              | Confirm dialog before complete      | `hasEmail && !customerAlreadyReviewed` |
| **Call review-invite API?** | After Supabase `status = completed` | `willSendReviewInviteOnComplete`       |

`hasEmail` = `customer_email` non-empty after trim (web does not require valid format for modal copy).  
`customerAlreadyReviewed` = row in `reviews` for this `customer_id` at this business.  
`willSendReviewInviteOnComplete` = full check below (valid email, `customer_id`, no existing review, no pending invite, no invite for this booking).

### Data sources (owner Supabase session)

**1. Booking row** — you already have this when showing the appointment:

```sql
-- From bookings (filter by business_id via RLS)
SELECT id, customer_id, customer_email, status
FROM bookings
WHERE id = :bookingId;
```

**2. Eligibility context** — batch-load once per bookings screen (or just for the booking you are completing):

| Set                        | Query                                                                                                                            | Meaning                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `reviewedCustomerIds`      | `reviews` where `business_id = :businessId` and `customer_id IN (:customerIds)` → select `customer_id`                           | Customer already left a review          |
| `pendingInviteCustomerIds` | `review_invites` where `business_id = :businessId`, `status = 'pending'`, `customer_id IN (:customerIds)` → select `customer_id` | Open invite link not used yet           |
| `bookingIdsWithInvite`     | `review_invites` where `booking_id IN (:bookingIds)` → select `booking_id`                                                       | Invite already created for this booking |

`:businessId` = `business_profiles.id` where `profile_id = auth.uid()`.  
`:customerIds` / `:bookingIds` = deduped ids from the booking(s) on screen.

**Web equivalent:** `GET /api/availability/bookings` returns `customerAlreadyReviewed` and `willSendReviewInviteOnComplete` on each row — same logic, computed server-side. Mobile can compute the same flags client-side from Supabase instead of calling that API.

### Decision tree (copy into mobile)

```
ON bookings list load (or before complete tap):
  ctx := loadReviewEligibilityContext(supabase, businessId, bookings)

FOR the booking being completed:
  hasEmail := trim(booking.customer_email) != ''
  customerAlreadyReviewed := customer_id in ctx.reviewedCustomerIds
  willSend := willSendReviewInviteOnComplete(booking, ctx)

BEFORE confirm modal:
  showReviewInviteMessage := hasEmail && !customerAlreadyReviewed

AFTER Supabase UPDATE status = 'completed':
  IF willSend:
    POST /api/availability/bookings/{id}/review-invite
  ELSE:
    skip API (no email needed)
```

### Full eligibility for `willSendReviewInviteOnComplete`

All must be true:

| #   | Check                                                                 | Source                         |
| --- | --------------------------------------------------------------------- | ------------------------------ |
| 1   | `customer_email` trim + valid format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) | `bookings.customer_email`      |
| 2   | `customer_id` non-empty UUID                                          | `bookings.customer_id`         |
| 3   | No row in `reviews` for `(business_id, customer_id)`                  | `ctx.reviewedCustomerIds`      |
| 4   | No pending invite for customer at business                            | `ctx.pendingInviteCustomerIds` |
| 5   | No invite row for this `booking_id`                                   | `ctx.bookingIdsWithInvite`     |

If any fail → **do not call** review-invite (server would return `skipped: true` anyway).

### Example: modal vs API

| Booking                                      | Modal says “email will be sent”? | Call review-invite after complete? |
| -------------------------------------------- | -------------------------------- | ---------------------------------- |
| Has email, never reviewed, has `customer_id` | Yes                              | Yes                                |
| Has email, customer already reviewed         | No (simple confirm)              | No                                 |
| No email                                     | No                               | No                                 |
| Has email, no `customer_id`                  | Yes (has email, not reviewed)    | No (missing `customer_id`)         |
| Has email, pending invite for same customer  | Yes                              | No                                 |

Row 4–5: modal is optimistic (email only + not reviewed); API uses stricter rules.

---

## Client-side helpers (mirror web)

```typescript
type BookingForReviewEligibility = {
  id: string;
  customer_id: string | null;
  customer_email: string | null;
};

type ReviewEligibilityContext = {
  reviewedCustomerIds: Set<string>;
  pendingInviteCustomerIds: Set<string>;
  bookingIdsWithInvite: Set<string>;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizedCustomerEmail(
  raw: string | null | undefined
): string | null {
  const s = (raw ?? '').trim();
  return s && isValidEmail(s) ? s : null;
}

/** Same logic as web willSendReviewInviteOnComplete */
export function willSendReviewInviteOnComplete(
  booking: BookingForReviewEligibility,
  ctx: ReviewEligibilityContext
): boolean {
  const bookingId = booking.id?.trim();
  if (!bookingId) return false;
  if (!normalizedCustomerEmail(booking.customer_email)) return false;

  const customerId = booking.customer_id?.trim() ?? '';
  if (!customerId) return false;

  if (ctx.bookingIdsWithInvite.has(bookingId)) return false;
  if (ctx.reviewedCustomerIds.has(customerId)) return false;
  if (ctx.pendingInviteCustomerIds.has(customerId)) return false;

  return true;
}

/** For confirm-modal copy only (web parity) */
export function customerAlreadyReviewed(
  booking: Pick<BookingForReviewEligibility, 'customer_id'>,
  ctx: ReviewEligibilityContext
): boolean {
  const customerId = booking.customer_id?.trim() ?? '';
  return Boolean(customerId && ctx.reviewedCustomerIds.has(customerId));
}
```

### Loading eligibility context (Supabase, owner session)

Call when loading the bookings list or right before the complete flow. Uses the **same queries** as web `loadReviewInviteEligibilityContext`.

```typescript
async function loadReviewEligibilityContext(
  supabase: SupabaseClient,
  businessId: string,
  bookings: BookingForReviewEligibility[]
): Promise<ReviewEligibilityContext> {
  const customerIds = [
    ...new Set(
      bookings
        .map(b => b.customer_id?.trim())
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const bookingIds = bookings.map(b => b.id).filter(Boolean);

  const reviewedCustomerIds = new Set<string>();
  const pendingInviteCustomerIds = new Set<string>();
  const bookingIdsWithInvite = new Set<string>();

  if (customerIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('business_id', businessId)
      .in('customer_id', customerIds);

    for (const row of reviewRows ?? []) {
      if (row.customer_id) reviewedCustomerIds.add(row.customer_id);
    }

    const { data: pendingRows } = await supabase
      .from('review_invites')
      .select('customer_id')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .in('customer_id', customerIds);

    for (const row of pendingRows ?? []) {
      if (row.customer_id) pendingInviteCustomerIds.add(row.customer_id);
    }
  }

  if (bookingIds.length > 0) {
    const { data: inviteRows } = await supabase
      .from('review_invites')
      .select('booking_id')
      .in('booking_id', bookingIds);

    for (const row of inviteRows ?? []) {
      if (row.booking_id) bookingIdsWithInvite.add(row.booking_id);
    }
  }

  return {
    reviewedCustomerIds,
    pendingInviteCustomerIds,
    bookingIdsWithInvite,
  };
}
```

---

## Complete-appointment UX (match web)

Before confirming complete, show the appropriate modal using **DB-derived flags** (no API call):

| Condition                                 | Modal                                                                |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `hasEmail && !customerAlreadyReviewed`    | Mention that a **review request email** will be sent to the customer |
| Customer already reviewed **or** no email | Simple “Mark complete?” confirm (no email mention)                   |

`hasEmail` and `customerAlreadyReviewed` come from the booking row + `loadReviewEligibilityContext` (see above).

**After** Supabase complete: call review-invite **only** when `willSendReviewInviteOnComplete` is true.

## End-to-end flow (mobile)

```
1. Load bookings + loadReviewEligibilityContext(supabase, businessId, bookings)  ← read DB
2. Owner taps "Complete" on a confirmed booking
3. showReviewInviteMessage = hasEmail && !customerAlreadyReviewed  ← modal copy from DB flags
4. Owner confirms
5. UPDATE bookings SET status = 'completed' WHERE id = :bookingId  (Supabase, owner RLS)
6. IF willSendReviewInviteOnComplete(booking, ctx):
     POST /api/availability/bookings/{bookingId}/review-invite
7. Treat HTTP 200 + skipped as OK (race / already sent)
8. Do NOT roll back step 5 if step 6 fails — email is best-effort (same as web)
```

---

## Response shapes

### Success — email sent

**HTTP 200**

```json
{
  "success": true,
  "sent": true,
  "skipped": false,
  "inviteId": "uuid-of-review_invites-row"
}
```

### Success — skipped (not eligible or already invited)

**HTTP 200**

```json
{
  "success": true,
  "sent": false,
  "skipped": true,
  "reason": "customer_already_reviewed"
}
```

| `reason`                    | Meaning                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `no_customer_email`         | Missing or invalid `customer_email` on booking                   |
| `no_customer_id`            | Missing `customer_id` on booking                                 |
| `invite_already_exists`     | `review_invites` row already exists for this `booking_id`        |
| `customer_already_reviewed` | `reviews` row exists for `(business_id, customer_id)`            |
| `pending_invite_exists`     | Another pending invite exists for this customer at this business |

### Success — invite created, email failed (best-effort)

**HTTP 200**

```json
{
  "success": true,
  "sent": false,
  "skipped": false,
  "inviteId": "uuid-of-review_invites-row"
}
```

Invite row exists; Resend failed server-side. Do not retry complete; optional future “resend invite” feature is not built yet.

### Errors

| Status  | Body                                                                                        | When                               |
| ------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| **400** | `{ "success": false, "error": "Booking must be completed before sending a review invite" }` | Called before `status = completed` |
| **400** | `{ "success": false, "error": "Booking ID required" }`                                      | Bad path param                     |
| **401** | `{ "success": false, "error": "Unauthorized" }`                                             | Missing/invalid Bearer             |
| **404** | `{ "success": false, "error": "Booking not found" }`                                        | Wrong id or not owner’s business   |
| **500** | `{ "success": false, "error": "..." }`                                                      | Server/DB failure                  |

---

## TypeScript response types (copy into mobile)

```typescript
type ReviewInviteSkipReason =
  | 'no_customer_email'
  | 'no_customer_id'
  | 'invite_already_exists'
  | 'customer_already_reviewed'
  | 'pending_invite_exists';

type ReviewInviteSuccessResponse =
  | {
      success: true;
      sent: true;
      skipped: false;
      inviteId: string;
    }
  | {
      success: true;
      sent: false;
      skipped: true;
      reason: ReviewInviteSkipReason;
    }
  | {
      success: true;
      sent: false;
      skipped: false;
      inviteId: string;
    };

type ReviewInviteErrorResponse = {
  success: false;
  error: string;
};

type ReviewInviteResponse =
  | ReviewInviteSuccessResponse
  | ReviewInviteErrorResponse;
```

---

## Request tracing (recommended)

Send one of:

- `X-Request-ID: <opaque string>`
- `X-Correlation-ID: <opaque string>`

Server echoes **`X-Request-ID`** on every JSON response and includes the same id in structured logs (`[review-invite]` prefix). Log this id next to HTTP status on failures so mobile logs and server logs can be correlated.

Example:

```http
POST /api/availability/bookings/{bookingId}/review-invite
Authorization: Bearer <access_token>
X-Request-ID: mobile-complete-20260601-abc
```

---

## Server logging (safe for aggregators)

**One line per transaction** — prefix `[review-invite]`, event `finished`:

```
[review-invite] finished req=<id> source=mobile_api|web_patch biz=<8> booking=<8> outcome=sent invite=<8>
[review-invite] finished req=<id> source=mobile_api biz=<8> booking=<8> outcome=skipped reason=customer_already_reviewed
[review-invite] finished req=<id> source=web_patch biz=<8> booking=<8> outcome=invite_no_email invite=<8> emailErr=<truncated>
[review-invite] finished req=<id> source=mobile_api outcome=rejected http=404 error=Booking not found
[review-invite] finished req=<id> source=mobile_api outcome=failed error=<truncated>
```

| `outcome`         | Level | Meaning                                    |
| ----------------- | ----- | ------------------------------------------ |
| `sent`            | info  | Invite created + email delivered           |
| `skipped`         | info  | Not eligible (expected; includes `reason`) |
| `invite_no_email` | warn  | Invite row exists; Resend failed           |
| `rejected`        | warn  | Auth, not found, not completed, validation |
| `failed`          | error | DB/uncaught error                          |

Filter: `[review-invite] finished` + match `req=` to response header `X-Request-ID`.

**Never logged:** raw review URL, token, full UUIDs, customer email.

---

## Example HTTP call

```http
POST /api/availability/bookings/550e8400-e29b-41d4-a716-446655440000/review-invite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No request body.

---

## Example mobile pseudocode

```typescript
// On bookings screen mount / refresh:
const bookings = await loadBookingsFromSupabase(supabase, businessId);
const eligibilityCtx = await loadReviewEligibilityContext(
  supabase,
  businessId,
  bookings
);

async function onCompleteTapped(booking: BookingForReviewEligibility) {
  const hasEmail = Boolean(booking.customer_email?.trim());
  const alreadyReviewed = customerAlreadyReviewed(booking, eligibilityCtx);
  const showReviewInviteMessage = hasEmail && !alreadyReviewed;

  // Show modal using showReviewInviteMessage for copy
  await confirmComplete(showReviewInviteMessage);

  await completeBookingWithReviewInvite(
    supabase,
    apiBaseUrl,
    accessToken,
    businessId,
    booking,
    eligibilityCtx
  );
}

async function completeBookingWithReviewInvite(
  supabase: SupabaseClient,
  apiBaseUrl: string,
  accessToken: string,
  businessId: string,
  booking: BookingForReviewEligibility,
  eligibilityCtx: ReviewEligibilityContext
): Promise<{ completed: boolean; reviewInviteSent: boolean }> {
  const shouldSendInvite = willSendReviewInviteOnComplete(
    booking,
    eligibilityCtx
  );

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', booking.id)
    .eq('business_id', businessId);

  if (updateError) throw updateError;

  if (!shouldSendInvite) {
    return { completed: true, reviewInviteSent: false };
  }

  const res = await fetch(
    `${apiBaseUrl}/api/availability/bookings/${booking.id}/review-invite`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const json = (await res.json()) as ReviewInviteResponse;

  if (!res.ok || !json.success) {
    // Booking stays completed — same as web best-effort email
    console.warn('Review invite API failed', res.status, json);
    return { completed: true, reviewInviteSent: false };
  }

  return {
    completed: true,
    reviewInviteSent: json.sent === true,
  };
}
```

---

## Idempotency / double complete

- Safe to call again after web or mobile already sent: returns **200** with `skipped: true`, `reason: "invite_already_exists"`.
- Web **PATCH** complete on the same booking also runs invite logic — mobile should **not** assume it is the only caller; skipping is normal.

---

## What the email contains (for product copy)

- Subject: `How was your visit with {businessName}?`
- Link: `{SITE_URL}/review/{rawToken}` (90-day expiry, one-time submit)
- Customer does **not** need to log in; token in URL is the auth

---

## QA checklist (staging)

| Check                                            | Expected                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Complete booking, eligible customer              | **200**, `sent: true`, customer receives email                                       |
| Complete booking, no `customer_email`            | Skip API locally; if called anyway → **200** `skipped`, `reason: no_customer_email`  |
| Complete booking, no `customer_id`               | Skip API locally; if called anyway → **200** `skipped`, `reason: no_customer_id`     |
| Customer already reviewed                        | Skip API locally; if called → **200** `skipped`, `reason: customer_already_reviewed` |
| Call before `status = completed`                 | **400**                                                                              |
| No Bearer token                                  | **401**                                                                              |
| Wrong `bookingId`                                | **404**                                                                              |
| Complete on web, then mobile calls same endpoint | **200** `skipped`, `reason: invite_already_exists`                                   |

---

## Related docs

- [FLOWS.md](../../src/features/reviews/docs/FLOWS.md) — full reviews E2E (web + mobile section)
- [REVIEW_INVITES_TABLE.md](../../src/features/reviews/docs/REVIEW_INVITES_TABLE.md) — DB schema
- Web booking list flags: `customerAlreadyReviewed`, `willSendReviewInviteOnComplete` on `GET /api/availability/bookings`
