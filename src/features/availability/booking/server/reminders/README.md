# Day-before booking reminders

One cron job, two audiences. Schedule and auth live in [`src/features/cron`](../../../../cron/docs/README.md).

| Audience | Channel | Entry |
| -------- | ------- | ----- |
| Owner | Expo push + in-app bell | `notifyOwnerForBookingReminder` |
| Customer | Email and/or SMS | `notifyCustomerForBookingReminder` |

`runBookingReminders` is what `/api/internal/cron/booking-reminders` calls.

```
reminders/
  runBookingReminders.ts      cron entry
  runOwnerBookingReminders.ts one push per owner
  runCustomerBookingReminders.ts email + SMS per booking
  notifyOwnerForBookingReminder.ts
  notifyCustomerForBookingReminder.ts
  loadConfirmedReminderBookings.ts
  ownerBookingReminderCopy.ts
  ownerBookingReminderDate.ts
```

Customer SMS uses `sendAndRecordSms` (`type: booking_reminder`) so it shows in the owner message inbox.
