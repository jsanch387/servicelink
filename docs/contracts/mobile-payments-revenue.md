# Contract: Payments revenue (web matches mobile)

`GET /api/payments/revenue?period=&timeZone=&from=&to=`

Web and mobile show the **same completed-job earnings**. This is not a Stripe ledger.

| Rule | Source of truth |
| --- | --- |
| Who | `bookings.status = 'completed'` only |
| How much | `computeBookingEarningsCents` — completed → `collectedCents = potentialCents` |
| Which day | `scheduled_date` (`YYYY-MM-DD`), not payment time |
| Timezone | Owner `timeZone` (IANA) for “today” and calendar windows |

| `period` | Window | Compare | Bars |
| --- | --- | --- | --- |
| `week` | Mon–Sun containing today | Previous Mon–Sun | 7 days `Mo`…`Su` |
| `month` | 1st → last of this calendar month | Last calendar month | `Wk 1`–`Wk 4` (days 1–7, 8–14, 15–21, 22–end) |
| `year` | Jan 1 → Dec 31 this year (`ytd` is accepted as an alias) | Last calendar year | 12 months |
| `all` | No `scheduled_date` filter | None | One bar per year with activity |
| `custom` | Inclusive `from`–`to` (swapped if inverted). Start and end must be **different** days. Not clamped to today. | Equal length immediately before `from` | Daily ≤62 days. 63–180 days: 7-day chunks labeled by start date (`Jul 15`). Longer: calendar months. |

## Money

Do not sum Stripe net or offline `booking_payments` as a second ledger. Nested `booking_payments` is only used to price the job.

A completed $200 job with $0 on the payment row still charts as **$200** on the **scheduled** day.

## Response

`{ collectedCents / totalCents, jobsPaid, changePercent, bucketKind, bars / buckets[] }`

Change %: prior `<= 0` and current `> 0` → **100**. All time hides the comparison.

## Do not

- Do not use rolling last 7 / last 30 for this chart.
- Do not treat Year as YTD-through-today.
- Do not mix Stripe fees/refunds into this total.
