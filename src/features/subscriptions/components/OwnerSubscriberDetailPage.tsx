'use client';

import { Button, Modal, toast } from '@/components/shared';
import {
  API_ROUTES,
  getOwnerCreateAppointmentPath,
  ROUTES,
} from '@/constants/routes';
import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import {
  formatCadencePricePeriod,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import {
  formatSubscriberBillingDate,
  formatSubscriberBillingDateValue,
  formatSubscriberPlanLabel,
  formatSubscriberVisitTime,
  getSubscriberBillingDateLabel,
  getSubscriberStatusClassName,
  getSubscriberStatusLabel,
  isSubscriberCancelScheduled,
  OWNER_SUBSCRIBER_STATUS_STYLES,
} from '../utils/ownerSubscriberDisplay';
import { OwnerSubscriberDetailSkeleton } from './OwnerSubscriberDetailSkeleton';

interface OwnerSubscriberDetailPageProps {
  subscriberId: string;
}

async function fetchSubscriber(
  subscriberId: string
): Promise<OwnerSubscriber | null> {
  const res = await fetch(API_ROUTES.MEMBERSHIPS_SUBSCRIBER(subscriberId), {
    credentials: 'same-origin',
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    subscriber?: OwnerSubscriber;
  } | null;
  if (!res.ok || !json?.success || !json.subscriber) return null;
  return json.subscriber;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-zinc-100">{value}</dd>
    </div>
  );
}

export const OwnerSubscriberDetailPage: React.FC<
  OwnerSubscriberDetailPageProps
> = ({ subscriberId }) => {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [subscriber, setSubscriber] = useState<OwnerSubscriber | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const reload = useCallback(async () => {
    const next = await fetchSubscriber(subscriberId);
    setSubscriber(next);
  }, [subscriberId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchSubscriber(subscriberId);
      if (!cancelled) {
        setSubscriber(next);
        setNotesDraft(next?.notes?.trim() || '');
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriberId]);

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      const res = await fetch(API_ROUTES.MEMBERSHIPS_SUBSCRIBER(subscriberId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_notes', notes: notesDraft }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        subscriber?: OwnerSubscriber;
      } | null;
      if (!res.ok || !json?.success || !json.subscriber) {
        toast.error(json?.error || 'Could not save notes.');
        return;
      }
      setSubscriber(json.subscriber);
      setNotesDraft(json.subscriber.notes?.trim() || '');
      toast.success('Notes saved');
    } catch {
      toast.error('Could not save notes.');
    } finally {
      setNotesSaving(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const runCancelAction = async (
    action: 'cancel_at_period_end' | 'cancel_now'
  ) => {
    setBusyAction(action);
    try {
      const res = await fetch(API_ROUTES.MEMBERSHIPS_SUBSCRIBER(subscriberId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        subscriber?: OwnerSubscriber;
        alreadyCanceled?: boolean;
      } | null;

      if (!res.ok || !json?.success) {
        // Stale UI after a prior Stripe cancel — refresh so the page matches.
        await reload();
        toast.error(json?.error || 'Something went wrong.');
        return;
      }

      setCancelOpen(false);
      if (json.subscriber) {
        setSubscriber(json.subscriber);
        setNotesDraft(json.subscriber.notes?.trim() || '');
      } else {
        await reload();
      }

      if (json.alreadyCanceled) {
        toast.success('Subscription already canceled — status updated');
      } else {
        toast.success(
          action === 'cancel_now'
            ? 'Subscription canceled'
            : 'Cancels at period end'
        );
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      toast.success('Email copied');
      window.setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      toast.error('Could not copy email.');
    }
  };

  const handleSendScheduleLink = async () => {
    setBusyAction('send_schedule_link');
    try {
      const res = await fetch(API_ROUTES.MEMBERSHIPS_SUBSCRIBER(subscriberId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_schedule_link' }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        emailed?: boolean;
        smsed?: boolean;
        scheduleUrl?: string;
      } | null;
      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Could not send schedule link.');
        return;
      }
      const parts: string[] = [];
      if (json.emailed) parts.push('email');
      if (json.smsed) parts.push('text');
      toast.success(
        parts.length
          ? `Schedule link sent via ${parts.join(' + ')}`
          : 'Schedule link sent'
      );
    } catch {
      toast.error('Could not send schedule link.');
    } finally {
      setBusyAction(null);
    }
  };

  const canCancel =
    subscriber != null &&
    subscriber.status !== 'canceled' &&
    !subscriber.cancelAtPeriodEnd &&
    !subscriber.planRemoved;

  if (!hydrated) {
    return <OwnerSubscriberDetailSkeleton />;
  }

  if (!subscriber || !OWNER_SUBSCRIBER_STATUS_STYLES[subscriber.status]) {
    return (
      <main className="min-h-screen w-full flex-1 bg-[var(--dashboard-bg)] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-400">Subscriber not found.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS)}
          >
            Back to Subscriptions
          </Button>
        </div>
      </main>
    );
  }

  const cancelScheduled = isSubscriberCancelScheduled(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );
  const statusLabel = getSubscriberStatusLabel(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );
  const statusClassName = getSubscriberStatusClassName(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );

  const lastPayment =
    subscriber.lastPaymentLabel?.trim() &&
    subscriber.lastPaymentLabel.trim() !== 'Paid'
      ? subscriber.lastPaymentLabel.trim()
      : null;
  const phoneRaw = subscriber.phone?.trim() || '';
  const phoneDisplay = phoneRaw ? formatCustomerPhone(phoneRaw) : '';
  const phoneHref = phoneRaw ? customerPhoneHref(phoneRaw) : null;
  const hasEmail =
    Boolean(subscriber.email?.trim()) && subscriber.email.trim() !== '—';
  const email = hasEmail ? subscriber.email.trim() : '';

  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
          className="mb-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Subscriptions
        </Link>

        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {subscriber.customerName}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {subscriber.planRemoved || !subscriber.planId ? (
                formatSubscriberPlanLabel(
                  subscriber.planName,
                  subscriber.planRemoved
                )
              ) : (
                <Link
                  href={ROUTES.DASHBOARD.SUBSCRIPTIONS_DETAIL(subscriber.planId)}
                  className="cursor-pointer text-zinc-400 transition-colors hover:text-white"
                >
                  {subscriber.planName}
                </Link>
              )}
            </p>
          </div>

          {canCancel ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(open => !open)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Subscriber actions"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[var(--dashboard-bg)] py-1 shadow-xl shadow-black/40"
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busyAction != null}
                    onClick={() => {
                      setMenuOpen(false);
                      setCancelOpen(true);
                    }}
                    className="flex w-full cursor-pointer px-3.5 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel subscription
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        {subscriber.planRemoved ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
            This plan was removed. The subscriber is kept for history — they
            are not on a live plan.
          </div>
        ) : cancelScheduled ? (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
            Canceled — access until{' '}
            {formatSubscriberBillingDate(subscriber.nextBillingAt)}. They won’t
            be billed again after that.
          </div>
        ) : null}

        {subscriber.status === 'past_due' ? (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
            Latest payment failed. Ask them to update their card from the manage
            link in their subscription email.
          </div>
        ) : null}

        {subscriber.visitStatus !== 'none' ? (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-zinc-400">
              {subscriber.visitStatus === 'completed'
                ? 'This period'
                : 'Next visit'}
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
              {subscriber.visitStatus === 'needs_visit' ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-100">
                      Needs a visit this period
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Book it yourself, or send them a link to pick a date.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-stretch">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      href={getOwnerCreateAppointmentPath({
                        membershipId: subscriber.id,
                        name: subscriber.customerName,
                        email: subscriber.email,
                        phone: subscriber.phone,
                        notes: subscriber.notes,
                        planName: subscriber.planName,
                        visitDurationMinutes:
                          subscriber.visitDurationMinutes ??
                          MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT,
                      })}
                    >
                      Book visit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyAction != null}
                      loading={busyAction === 'send_schedule_link'}
                      onClick={() => void handleSendScheduleLink()}
                    >
                      {busyAction === 'send_schedule_link'
                        ? 'Sending'
                        : 'Send schedule link'}
                    </Button>
                  </div>
                </div>
              ) : subscriber.visitStatus === 'completed' ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"
                      aria-hidden
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-emerald-100">
                        Visit complete
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-zinc-500">
                        {subscriber.periodVisitDate
                          ? formatSubscriberBillingDate(
                              subscriber.periodVisitDate
                            )
                          : 'Done this period'}
                        {subscriber.periodVisitTime
                          ? ` · ${formatSubscriberVisitTime(subscriber.periodVisitTime)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    href={ROUTES.DASHBOARD.BOOKINGS}
                    className="shrink-0"
                  >
                    View in Bookings
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {subscriber.periodVisitDate
                        ? formatSubscriberBillingDate(
                            subscriber.periodVisitDate
                          )
                        : 'Date on file'}
                      {subscriber.periodVisitTime
                        ? ` · ${formatSubscriberVisitTime(subscriber.periodVisitTime)}`
                        : ''}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Need to rebook? Cancel it in Bookings first.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    href={ROUTES.DASHBOARD.BOOKINGS}
                    className="shrink-0"
                  >
                    View in Bookings
                  </Button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Summary</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
            <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">
              {formatSubscriptionPriceCents(subscriber.amountCents)}
              <span className="ml-1.5 text-base font-normal text-zinc-500">
                /{' '}
                {formatCadencePricePeriod({
                  intervalUnit: subscriber.intervalUnit,
                  intervalCount: subscriber.intervalCount,
                })}
              </span>
            </p>

            <dl className="mt-5 divide-y divide-white/[0.08] border-t border-white/[0.08]">
              <MetaRow
                label="Status"
                value={
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusClassName}`}
                  >
                    {statusLabel}
                  </span>
                }
              />
              <MetaRow label="Schedule" value={subscriber.cadenceLabel} />
              <MetaRow
                label={getSubscriberBillingDateLabel(
                  subscriber.status,
                  subscriber.cancelAtPeriodEnd,
                  subscriber.planRemoved
                )}
                value={formatSubscriberBillingDateValue({
                  status: subscriber.status,
                  cancelAtPeriodEnd: subscriber.cancelAtPeriodEnd,
                  nextBillingAt: subscriber.nextBillingAt,
                  planRemoved: subscriber.planRemoved,
                })}
              />
              <MetaRow
                label="Started"
                value={formatSubscriberBillingDate(subscriber.startedAt)}
              />
              {lastPayment ? (
                <MetaRow label="Last payment" value={lastPayment} />
              ) : null}
            </dl>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Contact</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-2">
            <ul className="divide-y divide-white/[0.08]">
              <li>
                {hasEmail ? (
                  <div className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300">
                      <EnvelopeIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-500">Email</p>
                      <a
                        href={`mailto:${email}`}
                        className="block cursor-pointer truncate text-sm text-white transition-colors hover:text-zinc-200"
                      >
                        {email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyEmail(email)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      aria-label="Copy email"
                      title="Copy email"
                    >
                      {emailCopied ? (
                        <CheckIcon
                          className="h-4 w-4 text-emerald-400"
                          aria-hidden
                        />
                      ) : (
                        <ClipboardDocumentIcon
                          className="h-4 w-4"
                          aria-hidden
                        />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="-mx-2 flex items-center gap-3 px-2 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-500">
                      <EnvelopeIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-zinc-500">Email</span>
                      <span className="block text-sm text-zinc-500">—</span>
                    </span>
                  </div>
                )}
              </li>
              <li>
                {phoneDisplay && phoneHref ? (
                  <a
                    href={phoneHref}
                    className="-mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300">
                      <PhoneIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-zinc-500">Phone</span>
                      <span className="block truncate text-sm text-white tabular-nums">
                        {phoneDisplay}
                      </span>
                    </span>
                  </a>
                ) : (
                  <div className="-mx-2 flex items-center gap-3 px-2 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-500">
                      <PhoneIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-zinc-500">Phone</span>
                      <span className="block text-sm text-zinc-500">—</span>
                    </span>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Notes</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <label htmlFor="subscriber-notes" className="sr-only">
              Owner notes
            </label>
            <textarea
              id="subscriber-notes"
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Preferences, gate codes, best times…"
              className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-600">
                Used when you book their membership visit.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={notesSaving}
                disabled={
                  notesDraft.trim() === (subscriber.notes?.trim() || '')
                }
                onClick={() => void handleSaveNotes()}
              >
                {notesSaving ? 'Saving' : 'Save notes'}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel subscription?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-400">
            {subscriber.customerName} will stop being billed for{' '}
            {subscriber.planName}. Prefer canceling at period end so they keep
            access until {formatSubscriberBillingDate(subscriber.nextBillingAt)}
            .
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="inverse"
              fullWidth
              disabled={busyAction != null}
              onClick={() => {
                void (async () => {
                  await runCancelAction('cancel_at_period_end');
                  setCancelOpen(false);
                })();
              }}
            >
              Cancel at period end
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              disabled={busyAction != null}
              onClick={() => {
                void (async () => {
                  await runCancelAction('cancel_now');
                  setCancelOpen(false);
                })();
              }}
            >
              Cancel now
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              disabled={busyAction != null}
              onClick={() => setCancelOpen(false)}
            >
              Keep subscription
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
};
