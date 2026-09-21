# Contract: Mobile — Team invite

The owner sends a team invite from ServiceLink mobile. The hire **accepts on web** (`/team/invite/<token>`). Mobile only sends the invite.

**Implementation:** `POST /api/team/invites` in `src/app/api/team/invites/route.ts`  
**Handler:** `createTeamInvite` in `src/features/team/server/createTeamInvite.ts`  
**Feature:** [`src/features/team/docs/TEAM_FEATURE.md`](../../src/features/team/docs/TEAM_FEATURE.md)

---

## Endpoint

|                |                                              |
| -------------- | -------------------------------------------- |
| **Method**     | `POST`                                       |
| **Path**       | `/api/team/invites`                          |
| **Production** | `https://myservicelink.app/api/team/invites` |
| **Local**      | `http://localhost:3000/api/team/invites`     |

---

## Authentication

**Required.** Same route as the web dashboard.

| Client | Header                                          |
| ------ | ----------------------------------------------- |
| Mobile | `Authorization: Bearer <Supabase access_token>` |
| Web    | Session cookies                                 |

A cookies-only client without a session, or a missing/invalid Bearer token, returns **`401`**.

---

## Who

**Shop owner only** (`team.manage`). The shop is the owned `business_profiles` row. Members get **`403`**.

Do not send `businessId`. The server resolves the shop from the signed-in owner.

---

## Request body (JSON)

```json
{ "email": "sam@example.com", "name": "Sam Rivera" }
```

| Field   | Type   | Required      | Notes                                                                                   |
| ------- | ------ | ------------- | --------------------------------------------------------------------------------------- |
| `email` | string | Yes           | Invitee. Normalized lowercase.                                                          |
| `name`  | string | Yes on mobile | Owner-typed label. Trim. Max 80. Do not derive from email. Web may omit → store `null`. |

---

## Behavior

- **400** if the email is missing or invalid, or if they invite themselves.
- **400** `{ "ok": false, "error": "Enter their name." }` if `name` is present but blank or longer than 80 characters.
- **409** if that email is already an **active** member of this shop.
- If a **pending** invite exists for this shop + email: refresh token + 14-day expiry and resend. Non-empty `name` updates the row.
- If they were **removed** earlier: reopen that invite row (`revoked` → `pending`, new token) and email again.
- One invite row per shop + email.
- Store a SHA-256 hash of the token, never the raw token.
- Keep `name` after accept. Mobile uses it as the Team / Assignee label.
- Email subject: invite to join this shop. Link: `/team/invite/<token>`.
- If the email does not send, the response is **not** success.

---

## Success

**`201`** new invite / **`200`** resend (`resent: true`):

```json
{
  "ok": true,
  "resent": false,
  "invite": {
    "id": "<team_invites.id>",
    "email": "sam@example.com",
    "name": "Sam Rivera",
    "status": "pending"
  }
}
```

---

## Errors

JSON `{ "error": "human message" }`.

| Status | When                                  |
| ------ | ------------------------------------- |
| `400`  | Invalid email or self-invite          |
| `401`  | Missing or invalid Bearer / session   |
| `403`  | Not the owner                         |
| `409`  | Already an active member of this shop |
| `500`  | Invite row or email send failed       |

---

## Accept (not mobile)

The hire opens the email link on web, signs in with that same email, and `POST /api/team/invites/accept` with `{ "token" }`. Mobile does not accept the invite.
