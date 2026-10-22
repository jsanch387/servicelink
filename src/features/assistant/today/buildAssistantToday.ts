import { NEEDS_ATTENTION_DAYS } from '@/features/customer-management/utils/customerAttention';

import type { ActivityEntry } from '../types';

/** Wait this many days after a completed visit before a review follow-up. */
export const REVIEW_FOLLOWUP_AFTER_DAYS = 3;

export const REBOOK_CHECKIN_AFTER_DAYS = NEEDS_ATTENTION_DAYS;

export type AssistantSubject =
  | 'review_followup'
  | 'rebook_checkin'
  | 'quote_followup'
  | 'invoice_reminder';

/** A sent quote is worth a nudge once it has been out at least a day. */
export const QUOTE_FOLLOWUP_AFTER_DAYS = 1;

/** An invoice with no due date is worth a nudge once it has been out at least a day. */
export const INVOICE_FOLLOWUP_AFTER_DAYS = 1;

export type AssistantCustomerInput = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  lastVisitDaysAgo: number | null;
  lastVisitBookingId: string | null;
  hasUpcomingAppointment: boolean;
  hasReview: boolean;
};

export type AssistantActionInput = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  kind: string;
  subject: string;
  createdAt: string;
};

export type AssistantPerson = {
  id: string;
  customerId: string;
  bookingId: string | null;
  subject: AssistantSubject;
  name: string;
  firstName: string;
  days: number;
  detail: string;
  body: string;
};

export type AssistantQuoteInput = {
  id: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  amountCents: number;
  serviceName: string | null;
  daysWaiting: number;
};

export type AssistantInvoiceInput = {
  id: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  amountCents: number;
  daysSinceSent: number;
  /** Null when the bill has no due date. Zero is due today. Positive is overdue. */
  daysOverdue: number | null;
  payUrl: string | null;
};

export type AssistantBrief = {
  intro: string[];
  quotes: string | null;
  invoices: string | null;
  review: string | null;
  checkIn: string | null;
};

export type AssistantToday = {
  brief: AssistantBrief;
  quotes: AssistantPerson[];
  invoices: AssistantPerson[];
  reviews: AssistantPerson[];
  checkIns: AssistantPerson[];
  activity: ActivityEntry[];
};

const ACTIVITY_LIMIT = 50;

const DECISIONS = new Set(['skipped', 'unskipped', 'sent']);

export function emptyAssistantToday(now: Date = new Date()): AssistantToday {
  return buildAssistantToday({
    customers: [],
    actions: [],
    bookingUrl: '',
    now,
  });
}

export function isQuoteWaiting(daysSinceSent: number): boolean {
  return daysSinceSent >= QUOTE_FOLLOWUP_AFTER_DAYS;
}

export function isInvoiceWaiting(input: {
  daysSinceSent: number;
  daysOverdue: number | null;
}): boolean {
  if (input.daysOverdue !== null) return input.daysOverdue >= 0;
  return input.daysSinceSent >= INVOICE_FOLLOWUP_AFTER_DAYS;
}

export function buildAssistantToday(input: {
  customers: readonly AssistantCustomerInput[];
  quotes?: readonly AssistantQuoteInput[];
  invoices?: readonly AssistantInvoiceInput[];
  actions: readonly AssistantActionInput[];
  bookingUrl: string;
  now?: Date;
}): AssistantToday {
  const now = input.now ?? new Date();
  const suppressed = suppressedKeys(input.actions);
  const reviews: AssistantPerson[] = [];
  const checkIns: AssistantPerson[] = [];
  const quotes: AssistantPerson[] = [];
  const invoices: AssistantPerson[] = [];

  for (const customer of input.customers) {
    if (!canReach(customer)) continue;
    const name = customer.fullName.trim();
    if (!name) continue;
    const days = customer.lastVisitDaysAgo;
    if (days === null) continue;

    if (
      !customer.hasReview &&
      days >= REVIEW_FOLLOWUP_AFTER_DAYS &&
      !suppressed.has(key(customer.id, 'review_followup'))
    ) {
      reviews.push(
        person(customer, 'review_followup', name, days, input.bookingUrl)
      );
    }

    if (
      !customer.hasUpcomingAppointment &&
      days > REBOOK_CHECKIN_AFTER_DAYS &&
      !suppressed.has(key(customer.id, 'rebook_checkin'))
    ) {
      checkIns.push(
        person(customer, 'rebook_checkin', name, days, input.bookingUrl)
      );
    }
  }

  for (const quote of input.quotes ?? []) {
    if (!isQuoteWaiting(quote.daysWaiting)) continue;
    if (!hasContact(quote.phone, quote.email)) continue;
    const name = quote.customerName.trim();
    if (!name) continue;
    if (suppressed.has(key(quote.id, 'quote_followup'))) continue;
    quotes.push(quotePerson(quote, name));
  }

  for (const invoice of input.invoices ?? []) {
    if (
      !isInvoiceWaiting({
        daysSinceSent: invoice.daysSinceSent,
        daysOverdue: invoice.daysOverdue,
      })
    ) {
      continue;
    }
    if (!hasContact(invoice.phone, invoice.email)) continue;
    const name = invoice.customerName.trim();
    if (!name) continue;
    if (suppressed.has(key(invoice.id, 'invoice_reminder'))) continue;
    invoices.push(invoicePerson(invoice, name));
  }

  reviews.sort(byDaysThenName);
  checkIns.sort(byDaysThenName);
  quotes.sort(byDaysThenName);
  invoices.sort(byDaysThenName);

  return {
    brief: assistantBrief({ quotes, invoices, reviews, checkIns }),
    quotes,
    invoices,
    reviews,
    checkIns,
    activity: activityEntries(input.actions, now),
  };
}

function person(
  customer: AssistantCustomerInput,
  subject: AssistantSubject,
  name: string,
  days: number,
  bookingUrl: string
): AssistantPerson {
  const firstName = name.split(/\s+/)[0] || name;
  const dayWord = days === 1 ? 'day' : 'days';

  if (subject === 'review_followup') {
    return {
      id: `${customer.id}:review_followup`,
      customerId: customer.id,
      bookingId: customer.lastVisitBookingId,
      subject,
      name,
      firstName,
      days,
      detail: `No review yet. It’s been ${days} ${dayWord}.`,
      body: `Hey ${firstName}, hope the detail is still looking great. Would you mind leaving a quick review when you get a chance? It really helps. [review link]`,
    };
  }

  const link = bookingUrl.trim();
  const bookLine = link
    ? ` Book here: ${link}. Or call or text me.`
    : ' Call or text me and I’ll hold a spot.';

  return {
    id: `${customer.id}:rebook_checkin`,
    customerId: customer.id,
    bookingId: customer.lastVisitBookingId,
    subject,
    name,
    firstName,
    days,
    detail: `Hasn’t booked in ${days} ${dayWord}.`,
    body: `Hey ${firstName}, it’s been ${days} ${dayWord} since your last detail. I can hold a spot this week or next.${bookLine}`,
  };
}

export function assistantBrief(groups: {
  quotes: readonly AssistantPerson[];
  invoices: readonly AssistantPerson[];
  reviews: readonly AssistantPerson[];
  checkIns: readonly AssistantPerson[];
}): AssistantBrief {
  const count =
    groups.quotes.length +
    groups.invoices.length +
    groups.reviews.length +
    groups.checkIns.length;
  return {
    intro: [
      'Good morning.',
      count === 0
        ? 'Nothing is waiting on you right now.'
        : `I found ${count} ${count === 1 ? 'thing' : 'things'} that need you.`,
    ],
    quotes: quoteLine(groups.quotes),
    invoices: invoiceLine(groups.invoices),
    review: reviewLine(groups.reviews),
    checkIn: checkInLine(groups.checkIns),
  };
}

function quoteLine(people: readonly AssistantPerson[]): string | null {
  const first = people[0];
  if (!first) return null;
  const dayWord = first.days === 1 ? 'day' : 'days';
  if (people.length === 1) {
    return `${first.firstName}’s quote has been out for ${first.days} ${dayWord}. A nudge is ready.`;
  }
  return `${first.firstName}’s quote has been out for ${first.days} ${dayWord}. ${people.length} quotes are still waiting on a reply.`;
}

function invoiceLine(people: readonly AssistantPerson[]): string | null {
  const first = people[0];
  if (!first) return null;
  if (people.length === 1) {
    return `${first.firstName}’s invoice is still open. A reminder is ready.`;
  }
  return `${first.firstName}’s invoice is still open. ${people.length} invoices haven’t been paid.`;
}

function reviewLine(people: readonly AssistantPerson[]): string | null {
  const first = people[0];
  if (!first) return null;
  if (people.length === 1) {
    return `${first.firstName} hasn’t left a review yet. It’s been ${first.days} ${first.days === 1 ? 'day' : 'days'}, so I prepared a short follow-up.`;
  }
  return `${first.firstName} hasn’t left a review yet. ${people.length} customers are still waiting, so I prepared a short follow-up for each.`;
}

function checkInLine(people: readonly AssistantPerson[]): string | null {
  const first = people[0];
  if (!first) return null;
  const dayWord = first.days === 1 ? 'day' : 'days';
  if (people.length === 1) {
    return `${first.firstName} hasn’t booked in ${first.days} ${dayWord}. A check-in is ready when you want to send it.`;
  }
  return `${first.firstName} hasn’t booked in ${first.days} ${dayWord}. ${people.length} customers could use a check-in.`;
}

function activityEntries(
  actions: readonly AssistantActionInput[],
  now: Date
): ActivityEntry[] {
  return [...actions]
    .filter(action => action.customerId || action.kind === 'tool_called')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, ACTIVITY_LIMIT)
    .map(action => toActivityEntry(action, now));
}

function toActivityEntry(
  action: AssistantActionInput,
  now: Date
): ActivityEntry {
  const name = action.customerName?.trim() || 'A customer';
  const time = formatActionTime(action.createdAt, now);

  if (action.kind === 'tool_called') {
    const label = action.subject
      .replace(/_/g, ' ')
      .replace(/^\w/, letter => letter.toUpperCase());
    return {
      id: action.id,
      time,
      label,
      detail: `${name} · tool ran.`,
      kind: 'brief',
      topic: 'brief',
      actor: 'Assistant',
    };
  }

  const review = action.subject === 'review_followup';
  const quote = action.subject === 'quote_followup';
  const invoice = action.subject === 'invoice_reminder';
  const topic = review ? 'review' : quote || invoice ? 'reminder' : 'rebook';
  const what = review
    ? 'review follow-up'
    : quote
      ? 'quote follow-up'
      : invoice
        ? 'invoice reminder'
        : 'check-in';

  if (action.kind === 'sent') {
    return {
      id: action.id,
      time,
      label: review
        ? 'Review follow-up sent'
        : quote
          ? 'Quote follow-up sent'
          : invoice
            ? 'Invoice reminder sent'
            : 'Check-in sent',
      detail: `You sent ${name}’s ${what}.`,
      kind: topic,
      topic,
      actor: 'You',
    };
  }

  if (action.kind === 'unskipped') {
    return {
      id: action.id,
      time,
      label: review
        ? 'Review follow-up restored'
        : quote
          ? 'Quote follow-up restored'
          : invoice
            ? 'Invoice reminder restored'
            : 'Check-in restored',
      detail: `You brought ${name}’s ${what} back.`,
      kind: topic,
      topic,
      actor: 'You',
    };
  }

  return {
    id: action.id,
    time,
    label: review
      ? 'Review follow-up skipped'
      : quote
        ? 'Quote follow-up skipped'
        : invoice
          ? 'Invoice reminder skipped'
          : 'Check-in skipped',
    detail: `You skipped ${name}’s ${what}.`,
    kind: topic,
    topic,
    actor: 'You',
  };
}

function suppressedKeys(actions: readonly AssistantActionInput[]): Set<string> {
  const latest = new Map<string, string>();
  const ordered = [...actions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  for (const action of ordered) {
    if (!action.customerId || !DECISIONS.has(action.kind)) continue;
    if (
      action.subject !== 'review_followup' &&
      action.subject !== 'rebook_checkin' &&
      action.subject !== 'quote_followup' &&
      action.subject !== 'invoice_reminder'
    ) {
      continue;
    }
    const id = key(action.customerId, action.subject);
    if (!latest.has(id)) latest.set(id, action.kind);
  }

  const suppressed = new Set<string>();
  for (const [id, kind] of latest) {
    if (kind === 'skipped' || kind === 'sent') suppressed.add(id);
  }
  return suppressed;
}

function key(customerId: string, subject: AssistantSubject): string {
  return `${customerId}:${subject}`;
}

function canReach(customer: AssistantCustomerInput): boolean {
  return hasContact(customer.phone, customer.email);
}

function hasContact(phone: string | null, email: string | null): boolean {
  return Boolean(phone?.trim() || email?.trim());
}

function money(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function quotePerson(
  quote: AssistantQuoteInput,
  name: string
): AssistantPerson {
  const firstName = name.split(/\s+/)[0] || name;
  const dayWord = quote.daysWaiting === 1 ? 'day' : 'days';
  const amount = money(quote.amountCents);
  const service = quote.serviceName?.trim();
  const about = service ? `${service} quote` : 'quote';

  return {
    id: `${quote.id}:quote_followup`,
    customerId: quote.id,
    bookingId: null,
    subject: 'quote_followup',
    name,
    firstName,
    days: quote.daysWaiting,
    detail: `Out for ${quote.daysWaiting} ${dayWord} · ${amount}`,
    body: `Hey ${firstName}, just checking in on the ${about} for ${amount}. Happy to hold a spot if you want it.`,
  };
}

function invoicePerson(
  invoice: AssistantInvoiceInput,
  name: string
): AssistantPerson {
  const firstName = name.split(/\s+/)[0] || name;
  const amount = money(invoice.amountCents);
  const overdue = invoice.daysOverdue;
  const dayWord = overdue === 1 || invoice.daysSinceSent === 1 ? 'day' : 'days';
  const detail =
    overdue === null
      ? `Open for ${invoice.daysSinceSent} ${invoice.daysSinceSent === 1 ? 'day' : 'days'} · ${amount}`
      : overdue === 0
        ? `Due today · ${amount}`
        : `${overdue} ${dayWord} overdue · ${amount}`;
  const link = invoice.payUrl?.trim();
  const pay = link ? ` Pay here: ${link}` : '';

  return {
    id: `${invoice.id}:invoice_reminder`,
    customerId: invoice.id,
    bookingId: null,
    subject: 'invoice_reminder',
    name,
    firstName,
    days: overdue === null ? invoice.daysSinceSent : overdue,
    detail,
    body: `Hey ${firstName}, your invoice for ${amount} is still open.${pay}`,
  };
}

function byDaysThenName(a: AssistantPerson, b: AssistantPerson): number {
  if (b.days !== a.days) return b.days - a.days;
  return a.name.localeCompare(b.name);
}

function formatActionTime(iso: string, now: Date): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startThen = new Date(then);
  startThen.setHours(0, 0, 0, 0);
  const days = Math.round(
    (startToday.getTime() - startThen.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
