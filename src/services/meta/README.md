# Meta messaging (Instagram DMs)

## Env

| Variable                          | Required     | Notes                                                                                                        |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `META_PAGE_ACCESS_TOKEN`          | Fallback     | Used when no `instagram_messaging_channels` row exists (manual / legacy wiring).                             |
| `INSTAGRAM_MESSAGING_BUSINESS_ID` | Fallback     | `business_profiles.id` UUID — see [docs/instagram-tenant-setup.md](../../../docs/instagram-tenant-setup.md). |
| `META_APP_ID` / `META_APP_SECRET` | Connect flow | Facebook Login for dashboard **Automation → Connect Instagram**.                                             |
| `INSTAGRAM_MESSAGING_ACCOUNT_ID`  | Recommended  | Webhook `entry[0].id`; rejects webhooks from a different IG account.                                         |

Format in `.env.local` (no quotes needed):

```env
META_PAGE_ACCESS_TOKEN=EAAxxxxxxxx...
```

If you see `Invalid OAuth access token - Cannot parse access token` (code 190):

1. Re-copy the token with no spaces or line breaks.
2. Confirm it is a **Page** token, not a short-lived User token pasted by mistake.
3. Restart `npm run dev` after editing `.env.local`.

Outbound sends use `https://graph.facebook.com/v21.0/me/messages` with `messaging_product: "instagram"`.

## Echo webhooks

Meta also POSTs when **your business sends** a message (`message.is_echo: true`). The webhook skips those so the bot does not reply to itself (and burn OpenAI credits).
