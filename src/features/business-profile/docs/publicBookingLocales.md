# Public Booking Locales

This feature controls the language shown on public profile and booking pages.

See also: [business-profile docs index](./README.md) · [Service location](./serviceLocation.md)

## Source of truth

- DB columns on `business_profiles`:
  - `public_booking_locales` (offered locales, must include `en`)
  - `public_booking_default_locale` (business default, must be one of offered)

## Resolution rules

Locale is resolved per request with:

1. `?lang=` query param, when valid and offered by the business
2. `sl_booking_lang` cookie, when valid and offered
3. DB `public_booking_default_locale`, when valid and offered
4. First offered locale (normalized order: `en`, then `es`)

If only one locale is offered, that locale always wins.

## Toggle visibility

- Public profile language toggle renders only when the business offers 2+ locales.
- If business offers only `en`, toggle is hidden.

## Persistence behavior

- Dashboard edit saves both fields back to `business_profiles`.
- Public profile toggle writes the cookie and updates `?lang=` in the URL.
- Booking and quote routes reuse the same resolver to keep the flow consistent.

## Quick QA checklist

- Business set to `['en']` + default `en`:
  - Public profile shows no language toggle.
  - `/book` and `/book/details` remain English even with stale `?lang=es` or `es` cookie.
- Business set to `['en', 'es']` + default `en`:
  - Public profile shows toggle with EN/ES.
  - First visit without cookie/query opens in English.
- On bilingual business, switch to ES from profile:
  - URL adds `?lang=es`.
  - Next booking page keeps Spanish.
- Change dashboard default from EN -> ES:
  - New visitor (no query/cookie) lands in Spanish.
  - Returning visitor with cookie keeps their choice (cookie precedence).
