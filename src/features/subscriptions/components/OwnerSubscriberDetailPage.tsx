'use client';

import { Button, Modal, toast } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  LinkIcon,
  PhoneIcon,
  RectangleStackIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import { formatSubscriptionPriceCents } from '../utils/formatSubscriptionPrice';
import {
  formatSubscriberBillingDate,
  getSubscriberStatusClassName,
  getSubscriberStatusLabel,
  isSubscriberCancelScheduled,
  OWNER_SUBSCRIBER_STATUS_STYLES,
} from '../utils/ownerSubscriberDisplay';

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

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
  divided = false,
}: {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: React.ReactNode;
  href?: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 sm:gap-4 ${
        divided ? 'border-b border-white/[0.08] pb-3.5' : ''
      }`}
    >
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
      ) : null}
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
        <dt className="text-sm text-zinc-500">{label}</dt>
        <dd className="min-w-0 break-words text-sm text-zinc-100">
          {href ? (
            <a
              href={href}
              className="cursor-pointer break-words text-white underline-offset-2 hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </div>
      <dl className="space-y-3.5">{children}</dl>
    </section>
  );
}

export const OwnerSubscriberDetailPage: React.FC<
  OwnerSubscriberDetailPageProps
> = ({ subscriberId }) => {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [subscriber, setSubscriber] = useState<OwnerSubscriber | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

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
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriberId]);

  const runSubscriberAction = async (
    action:
      | 'cancel_at_period_end'
      | 'cancel_now'
      | 'portal_link'
      | 'portal_session'
  ) => {
    setBusyAction(action);
    setPortalNotice(null);
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
        manageUrl?: string;
        url?: string;
      } | null;

      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Something went wrong.');
        return;
      }

      if (action === 'portal_link' && json.manageUrl) {
        try {
          await navigator.clipboard.writeText(json.manageUrl);
          setPortalNotice('Manage / cancel link copied. Share it with them.');
          toast.success('Link copied');
        } catch {
          setPortalNotice(json.manageUrl);
        }
        return;
      }

      if (action === 'portal_session' && json.url) {
        window.open(json.url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (json.subscriber) {
        setSubscriber(json.subscriber);
        toast.success(
          action === 'cancel_now'
            ? 'Subscription canceled'
            : 'Cancels at period end'
        );
      } else {
        await reload();
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setBusyAction(null);
    }
  };

  const canCancel =
    subscriber != null &&
    subscriber.status !== 'canceled' &&
    !subscriber.cancelAtPeriodEnd;

  if (!hydrated) {
    return (
      <main className="min-h-screen w-full flex-1 bg-[var(--dashboard-bg)] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-2xl bg-white/[0.03]" />
      </main>
    );
  }

  if (!subscriber || !OWNER_SUBSCRIBER_STATUS_STYLES[subscriber.status]) {
    return (
      <main className="min-h-screen w-full flex-1 bg-[var(--dashboard-bg)] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
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

  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
          <Link
            href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Subscriptions
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Subscribers
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-zinc-300">
            {subscriber.customerName}
          </span>
        </nav>

        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {subscriber.customerName}
              </h1>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusClassName}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-zinc-500">
              {subscriber.planName} · {subscriber.cadenceLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<EnvelopeIcon className="h-4 w-4" aria-hidden />}
              href={`mailto:${subscriber.email}`}
            >
              Email
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<LinkIcon className="h-4 w-4" aria-hidden />}
              disabled={busyAction != null}
              onClick={() => void runSubscriberAction('portal_link')}
            >
              Billing portal
            </Button>
            {canCancel ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busyAction != null}
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        {cancelScheduled ? (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
            Canceled — access until{' '}
            {formatSubscriberBillingDate(subscriber.nextBillingAt)}. They won’t
            be billed again after that.
          </div>
        ) : null}

        {subscriber.status === 'past_due' ? (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
            Latest payment failed. Send a billing portal link so they can update
            their card.
          </div>
        ) : null}

        {portalNotice ? (
          <p className="mt-4 text-sm text-zinc-400" role="status">
            {portalNotice}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Amount',
              value: formatSubscriptionPriceCents(subscriber.amountCents),
            },
            {
              label: 'Next bill',
              value: formatSubscriberBillingDate(subscriber.nextBillingAt),
            },
            {
              label: 'Started',
              value: formatSubscriberBillingDate(subscriber.startedAt),
            },
            {
              label: 'Last payment',
              value: subscriber.lastPaymentLabel ?? '—',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
            >
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-base font-semibold tracking-tight text-white tabular-nums sm:text-lg">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start lg:gap-6">
          <div className="min-w-0 space-y-4">
            <SectionCard
              title="Subscription details"
              action={
                <Link
                  href={ROUTES.DASHBOARD.SUBSCRIPTIONS_DETAIL(
                    subscriber.planId
                  )}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  View plan
                  <ChevronLeftIcon
                    className="h-3.5 w-3.5 rotate-180"
                    aria-hidden
                  />
                </Link>
              }
            >
              <DetailRow
                divided
                icon={RectangleStackIcon}
                label="Plan"
                value={subscriber.planName}
              />
              <DetailRow
                divided
                icon={ArrowPathIcon}
                label="Schedule"
                value={subscriber.cadenceLabel}
              />
              <DetailRow
                divided
                icon={BanknotesIcon}
                label="Amount"
                value={formatSubscriptionPriceCents(subscriber.amountCents)}
              />
              <DetailRow
                divided
                icon={CheckBadgeIcon}
                label="Status"
                value={
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusClassName}`}
                  >
                    {statusLabel}
                  </span>
                }
              />
              <DetailRow
                divided
                icon={CalendarDaysIcon}
                label="Started"
                value={formatSubscriberBillingDate(subscriber.startedAt)}
              />
              <DetailRow
                icon={ClockIcon}
                label="Next bill"
                value={formatSubscriberBillingDate(subscriber.nextBillingAt)}
              />
            </SectionCard>

            <SectionCard title="Payment">
              <DetailRow
                icon={CreditCardIcon}
                label="Method"
                value={subscriber.paymentMethodLabel ?? '—'}
              />
              <DetailRow
                icon={CalendarDaysIcon}
                label="Last payment"
                value={subscriber.lastPaymentLabel ?? '—'}
              />
            </SectionCard>
          </div>

          <aside className="lg:sticky lg:top-24">
            <SectionCard title="Customer">
              <DetailRow
                icon={UserIcon}
                label="Name"
                value={subscriber.customerName}
              />
              <DetailRow
                icon={EnvelopeIcon}
                label="Email"
                value={subscriber.email}
                href={`mailto:${subscriber.email}`}
              />
              <DetailRow
                icon={PhoneIcon}
                label="Phone"
                value={subscriber.phone ?? '—'}
                href={
                  subscriber.phone
                    ? `tel:${subscriber.phone.replace(/\D/g, '')}`
                    : undefined
                }
              />
            </SectionCard>
          </aside>
        </div>

        <div className="mt-8 lg:hidden">
          <Link
            href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
            className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            Back to subscribers
          </Link>
        </div>
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
                  await runSubscriberAction('cancel_at_period_end');
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
                  await runSubscriberAction('cancel_now');
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
