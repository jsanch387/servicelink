# Scratch: Mobile — owner voice turn

**Not a final contract.** Incremental hand-off so the orb can POST a clip and show `ask` / `transcript`. A real contract comes later.

Owner-only. Same auth as owner-manual booking. **Do not** create a booking from this route. **Do not** upload the clip anywhere else.

**Web:** `POST /api/voice/turn` → `src/app/api/voice/turn/route.ts`  
**Feature:** `src/features/voice/`

---

## Endpoint

|                |                                                                                |
| -------------- | ------------------------------------------------------------------------------ |
| **Method**     | `POST`                                                                         |
| **Path**       | `/api/voice/turn`                                                              |
| **Local**      | `{EXPO_PUBLIC_WEB_APP_URL}/api/voice/turn` (dev often `http://localhost:3000`) |
| **Production** | `https://myservicelink.app/api/voice/turn`                                     |

---

## Auth

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session.access_token>` |

Signed-in **owner** only. 401 if the token is missing/invalid. 403 if signed in but not an owner.

---

## Request (`multipart/form-data`)

| Field   | Type        | Notes                                                               |
| ------- | ----------- | ------------------------------------------------------------------- |
| `audio` | file        | Required. Real `.m4a` (or wav). Max **15MB**. Not persisted.        |
| `draft` | JSON string | Optional. Phone session draft. Missing/invalid → server uses empty. |

Do **not** send `Content-Type: application/json`. Use multipart.

### `draft` shape (always send the full object, not a patch)

```json
{
  "customer": "",
  "phone": "",
  "service": "",
  "pricing": "",
  "addons": [],
  "vehicleYear": "",
  "vehicleMake": "",
  "vehicleModel": "",
  "address": "",
  "date": "",
  "time": ""
}
```

`addons` later: `[{ "id": "ceramic-coat", "name": "Ceramic coat", "priceLabel": "$149" }]`. Empty array is fine today.

---

## Success (`200`)

`transcript` is Deepgram Listen. Server merges the transcript into a **full** `draft` (`OPENAI_API_KEY` via `@ai-sdk/openai` + frozen catalog). `ask` / `speak` are the **next missing group** (server-owned order). `speakAudio` is Deepgram Speak of `speak` — **play this instead of device TTS**.

Empty / silent clips: draft stays put; `speak` is `I didn't catch that.` plus the same next question. Do not treat that as a new answer.

Related gaps are asked together: service + price, date + time, year + make + model.

```json
{
  "transcript": "book a full detail saturday at ten",
  "draft": {
    "customer": "",
    "phone": "",
    "service": "Full detail",
    "pricing": "$89",
    "addons": [],
    "vehicleYear": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "address": "",
    "date": "2026-09-12",
    "time": "10:00"
  },
  "missing": [
    "customer",
    "phone",
    "vehicleYear",
    "vehicleMake",
    "vehicleModel",
    "address"
  ],
  "ask": "What's the customer's name?",
  "speak": "What's the customer's name?",
  "speakAudio": {
    "mimeType": "audio/mpeg",
    "base64": "…mp3 bytes…"
  },
  "ready": false
}
```

Apply `{ transcript, draft, ask, speak, speakAudio, ready }` onto the session. **Send the latest full `draft` back on the next turn** (not a patch). Show `ask` / `transcript`. Play `speakAudio` when present.

`ready: true` means required fields are filled (addons optional). **Still do not create a booking** from this route — owner reviews on the phone.

---

## Errors

| Status | When                       | Body                                                                     |
| ------ | -------------------------- | ------------------------------------------------------------------------ |
| `401`  | No / bad JWT               | `{ "success": false, "error": "…" }`                                     |
| `403`  | Signed in, not an owner    | `{ "success": false, "error": "Forbidden" }`                             |
| `400`  | Missing / empty `audio`    | `{ "success": false, "error": "audio file is required" }`                |
| `413`  | `audio` over 15MB          | `{ "success": false, "error": "audio file is too large" }`               |
| `500`  | `DEEPGRAM_API_KEY` missing | `{ "success": false, "error": "Voice transcription is not configured" }` |
| `502`  | Deepgram failed            | `{ "success": false, "error": "Could not transcribe audio" }`            |

---

## Suggested mobile

`voice/api/postVoiceTurn.js` — FormData + Bearer, then session applies the `200` JSON.

Not this increment: live stream / Voice Agent, live catalog, slots, credits, guest voice, or `POST` that creates a booking.

Turn-based is the v1 conversation: hold → send clip → play `speakAudio` → hold again. Same `draft` builds across turns. Live sockets come later.
