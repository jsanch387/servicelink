# Contract: Mobile — Contact / support form

When a user submits the in-app contact form (feature request, bug report, or general message), call this API so the **server** emails ServiceLink support via Resend. Same behavior as the web `/contact` page.

**Do not** send support email from the mobile app directly.

**Implementation:** `POST /api/contact` in `src/app/api/contact/route.ts`  
**Handler:** `handleContactFormPost` in `src/features/contact/server/handleContactFormPost.ts`  
**Validation:** `parseContactFormBody` in `src/features/contact/utils/parseContactFormBody.ts`

---

## Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/contact` |
| **Production** | `https://myservicelink.app/api/contact` (or your `NEXT_PUBLIC_SITE_URL` + path) |
| **Local** | `http://localhost:3000/api/contact` |

---

## Authentication

**None required.** This is a public endpoint (like `POST /api/public/quote-request`). Users may be signed in or not; the server does not check `Authorization`.

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | **Yes** |

Optional: send `Authorization: Bearer …` if you already attach it globally — it is **ignored** for this route.

---

## Request body (JSON)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `name` | string | Yes | Max 120 characters after trim. |
| `email` | string | Yes | Valid email; used as **Reply-To** on the support email. |
| `topic` | string | Yes | One of: `feature_request`, `bug_report`, `other`. |
| `message` | string | Yes | 10–5000 characters after trim. |
| `website` | string | No | **Honeypot** — omit or send `""`. If non-empty, request is rejected. |

### Example

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "topic": "bug_report",
  "message": "The bookings list does not refresh after I approve a quote on iOS 18."
}
```

---

## Success response (HTTP `200`)

```json
{
  "success": true
}
```

---

## Error responses

All errors use:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP | `code` | When |
|------|--------|------|
| `400` | `INVALID_JSON` | Body is not valid JSON. |
| `400` | `VALIDATION_ERROR` | Missing/invalid fields or honeypot filled. |
| `405` | `METHOD_NOT_ALLOWED` | Not `POST`. |
| `413` | `PAYLOAD_TOO_LARGE` | Body larger than 12 KB. |
| `429` | `RATE_LIMITED` | Too many submissions; see `Retry-After` header (seconds). |
| `503` | `EMAIL_SEND_FAILED` | Resend unavailable or rejected (e.g. missing `RESEND_API_KEY`). |
| `500` | `SERVER_ERROR` | Unexpected failure. |

### Rate limits

Applied **after** validation (sliding window; shared across server instances when Upstash Redis is configured):

| Bucket | Limit | Window |
|--------|-------|--------|
| Per **client IP** | 8 submissions | 1 hour |
| Per **submitter email** (lowercased) | 5 submissions | 1 hour |

On `429`, show the `error` string and respect `Retry-After` before retrying.

---

## Mobile implementation checklist

1. `POST` to `{API_ORIGIN}/api/contact` with JSON body above.
2. On `200` + `success: true`, show your in-app confirmation UI.
3. On `429`, show rate-limit copy; do not auto-retry in a tight loop.
4. On `503` / `500`, show `error` and optional fallback to `mailto:` support if you ship it in-app.
5. Do **not** set `website` unless you intentionally mirror the web honeypot field (leave empty).

TypeScript types live in `src/features/contact/types.ts` (`ContactFormSubmitBody`, `ContactFormSubmitResponse`).
