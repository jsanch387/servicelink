# Contract: Mobile — Connect Google reviews

Owners connect the Google account that manages their Business Profile. ServiceLink imports those reviews onto the ServiceLink page. The web app and the Expo app use the **same endpoints**. Mobile sends a Bearer token and `{ "client": "mobile" }` so Google’s return opens the app instead of the dashboard.

**Web reference:** `POST /api/reviews/google/connect`, `GET /api/reviews/google/callback`, `GET /api/reviews/google/status`.

---

## Endpoints

| Purpose                       | Method | Path                           |
| ----------------------------- | ------ | ------------------------------ |
| Start Google connect          | `POST` | `/api/reviews/google/connect`  |
| Confirm the connection        | `GET`  | `/api/reviews/google/status`   |
| Google’s return (do not call) | `GET`  | `/api/reviews/google/callback` |

**Central path constants:** `API_ROUTES.REVIEWS_GOOGLE_CONNECT`, `API_ROUTES.REVIEWS_GOOGLE_STATUS`.

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

Same JWT as other authenticated mobile calls. The callback itself is Google’s browser redirect. The app does not call it.

---

## Start connect

```json
{
  "client": "mobile"
}
```

`client` must be exactly `"mobile"`.

### Success

**HTTP:** `200`

```json
{
  "success": true,
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

Open `url` in the system browser or an auth session (`WebBrowser.openAuthSessionAsync`). Do not change the URL.

The app’s browser will not be logged into ServiceLink. That is expected. The server finishes the connection when Google redirects, then opens:

`servicelinkmobile://reviews/google?google=connected`

or, if Google was cancelled or the connect failed:

`servicelinkmobile://reviews/google?google=error`

The browser first lands on `https://<api-host>/mobile-bridge/google-reviews?google=connected`, which opens that link.

### Errors

| HTTP  | Body `error`                                        | When                                    |
| ----- | --------------------------------------------------- | --------------------------------------- |
| `401` | `Authentication required` or `Missing bearer token` | No valid session                        |
| `500` | `Google Business is not configured.`                | Server is missing the Google OAuth keys |

---

## Confirm after the app opens

Call status. The callback already imported the reviews before it opened the app.

**HTTP:** `200`

```json
{
  "success": true,
  "connected": true,
  "locationTitle": "Black Label Detailing",
  "lastSyncedAt": "2026-11-02T18:00:00.000Z"
}
```

`connected: false` means Google is not linked yet. `locationTitle` and `lastSyncedAt` are `null` in that case.

New Google reviews also refresh on their own after this. The app does not need a separate pull to finish connect.
