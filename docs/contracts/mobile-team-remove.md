# Contract: Mobile — Remove team member

Owner removes a pending invite or an active hire. Same server path as web. The app does **not** update `business_members`, `team_invites`, or `bookings`.

**Implementation:** `POST /api/team/remove`  
**Handler:** `removeTeamMember`

---

## Endpoint

|                |                                             |
| -------------- | ------------------------------------------- |
| **Method**     | `POST`                                      |
| **Path**       | `/api/team/remove`                          |
| **Production** | `https://myservicelink.app/api/team/remove` |

---

## Authentication

**Required.** Owner only.

| Client | Header                                          |
| ------ | ----------------------------------------------- |
| Mobile | `Authorization: Bearer <Supabase access_token>` |
| Web    | Session cookies                                 |

Members get **403**. Missing/invalid token → **401**. Do not send `businessId`.

---

## Body

The list row already has `id` + `source`. Send those back.

**Pending invite** (`team_invites.id`, not yet accepted):

```json
{ "id": "<team_invites.id>", "source": "invite" }
```

**Active member** (`business_members.id`):

```json
{ "id": "<business_members.id>", "source": "member" }
```

`id` is the list row id. Do not send `user_id` or email.

---

## What the server does

**`source: "invite"`** — pending invite → `revoked`. No Auth delete. No booking changes.

**`source: "member"`** — do **not** delete the Auth user.

- `business_members.status` → `removed`
- Their accepted `team_invites` row → `revoked` (same row; a later invite reopens it)
- Upcoming **confirmed** jobs with that `assigned_user_id` → `null`
- Past / completed / cancelled keep the name
- `signOut(userId, 'global')` so they cannot walk back in

They need a new invite to rejoin. One invite row per shop + email.

---

## Success (`200`)

```json
{ "success": true }
```

Then refetch the Team list from Supabase (`pending` invites + `active` members). Drop the row locally.

---

## Errors

`{ "success": false, "error": "human message" }`

| Status | When                                                |
| ------ | --------------------------------------------------- |
| `400`  | Missing `id` or `source` is not `invite` / `member` |
| `401`  | Missing or invalid Bearer                           |
| `403`  | Not the owner                                       |
| `404`  | Invite or member not found (already gone)           |
| `500`  | Write failed                                        |
