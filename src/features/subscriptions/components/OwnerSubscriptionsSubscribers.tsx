'use client';

import { API_ROUTES, ROUTES } from '@/constants/routes';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  OwnerSubscriber,
  OwnerSubscriptionPlan,
} from '../types/ownerSubscriptionPlan';
import { formatSubscriptionPriceCents } from '../utils/formatSubscriptionPrice';
import {
  formatEndedSubscribersToggleLabel,
  formatSubscriberBillingDate,
  formatSubscriberBillingDateValue,
  formatSubscriberPlanLabel,
  getSubscriberStatusClassName,
  getSubscriberStatusLabel,
  isCurrentOwnerSubscriber,
  isSubscriberCancelScheduled,
} from '../utils/ownerSubscriberDisplay';

interface OwnerSubscriptionsSubscribersProps {
  plans?: OwnerSubscriptionPlan[];
  planIdFilter?: string;
  variant?: 'page' | 'embedded';
  hidePlanName?: boolean;
  onLoaded?: (subscribers: OwnerSubscriber[]) => void;
}

const NEEDS_VISIT_PILL_CLASS =
  'border-amber-400/25 bg-amber-500/10 text-amber-200';

/**
 * One status pill only. Priority: payment problems → Needs visit → billing status.
 * Active + Needs visit surfaces Needs visit. Canceled / canceling keep Canceled.
 */
function StatusPill({ subscriber }: { subscriber: OwnerSubscriber }) {
  const cancelScheduled = isSubscriberCancelScheduled(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );
  const paymentProblem =
    subscriber.status === 'past_due' || subscriber.status === 'unpaid';
  const canceled =
    subscriber.status === 'canceled' || cancelScheduled;

  if (
    !paymentProblem &&
    !canceled &&
    subscriber.visitStatus === 'needs_visit'
  ) {
    return (
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${NEEDS_VISIT_PILL_CLASS}`}
      >
        Needs visit
      </span>
    );
  }

  const label = getSubscriberStatusLabel(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );
  const className = getSubscriberStatusClassName(
    subscriber.status,
    subscriber.cancelAtPeriodEnd
  );

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}
      title={
        cancelScheduled && subscriber.nextBillingAt
          ? `Access until ${formatSubscriberBillingDate(subscriber.nextBillingAt)}`
          : undefined
      }
    >
      {label}
    </span>
  );
}

/**
 * Compact subscribers table — row click opens detail.
 */
export const OwnerSubscriptionsSubscribers: React.FC<
  OwnerSubscriptionsSubscribersProps
> = ({ planIdFilter, variant = 'page', hidePlanName = false, onLoaded }) => {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<OwnerSubscriber[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showEnded, setShowEnded] = useState(false);
  const embedded = variant === 'embedded';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const url = new URL(
          API_ROUTES.MEMBERSHIPS_SUBSCRIBERS,
          window.location.origin
        );
        if (planIdFilter?.trim()) {
          url.searchParams.set('planId', planIdFilter.trim());
        }
        const res = await fetch(url.pathname + url.search, {
          credentials: 'same-origin',
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          subscribers?: OwnerSubscriber[];
          error?: string;
        } | null;
        if (cancelled) return;
        if (!res.ok || !json?.success || !Array.isArray(json.subscribers)) {
          setError(json?.error || 'Could not load subscribers.');
          setSubscribers([]);
          onLoaded?.([]);
          return;
        }
        setSubscribers(json.subscribers);
        onLoaded?.(json.subscribers);
      } catch {
        if (!cancelled) {
          setError('Could not load subscribers.');
          setSubscribers([]);
          onLoaded?.([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [planIdFilter, onLoaded]);

  const rows = useMemo(() => subscribers ?? [], [subscribers]);
  const currentRows = useMemo(
    () => rows.filter(row => isCurrentOwnerSubscriber(row)),
    [rows]
  );
  const endedRows = useMemo(
    () => rows.filter(row => !isCurrentOwnerSubscriber(row)),
    [rows]
  );
  const visibleRows = useMemo(
    () => (showEnded ? [...currentRows, ...endedRows] : currentRows),
    [showEnded, currentRows, endedRows]
  );
  const endedCount = endedRows.length;
  const allEndedCanceled = endedRows.every(row => row.status === 'canceled');
  const listCountLabel =
    currentRows.length === 1
      ? '1 subscriber'
      : `${currentRows.length} subscribers`;
  const endedToggleLabel =
    endedCount > 0
      ? formatEndedSubscribersToggleLabel({
          endedCount,
          showingEnded: showEnded,
          allCanceled: allEndedCanceled,
        })
      : null;

  const openDetail = (id: string) => {
    router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER(id));
  };

  if (subscribers === null) {
    return (
      <div
        className={
          embedded
            ? 'px-4 py-3 sm:px-5'
            : 'overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]'
        }
      >
        <div className="space-y-0 divide-y divide-white/5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-3.5 w-28 animate-pulse rounded bg-white/[0.06]" />
              <div className="hidden h-3 w-24 animate-pulse rounded bg-white/[0.04] sm:block" />
              <div className="ml-auto h-3 w-14 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={
          embedded
            ? 'px-5 py-8 text-center sm:px-6'
            : 'rounded-lg border border-red-400/20 bg-red-400/10 px-6 py-8 text-center'
        }
      >
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={
          embedded
            ? 'flex flex-col items-center justify-center px-6 py-12 text-center'
            : 'flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-6 py-14 text-center'
        }
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
          <UsersIcon className="h-6 w-6 text-zinc-600" aria-hidden />
        </div>
        <h3 className="text-base font-semibold text-white">
          No subscribers yet
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500">
          {embedded
            ? 'People subscribed to this plan show up here.'
            : 'When someone subscribes from your booking link, they show up here.'}
        </p>
      </div>
    );
  }

  const showToolbar = !embedded || endedToggleLabel != null;

  return (
    <div className={embedded ? '' : 'space-y-3'}>
      {showToolbar ? (
        <div
          className={`flex items-baseline justify-between gap-3 ${
            embedded ? 'border-b border-white/5 px-4 py-2.5' : ''
          }`}
        >
          {!embedded && currentRows.length > 0 ? (
            <p className="text-sm text-zinc-500">{listCountLabel}</p>
          ) : (
            <span />
          )}
          {endedToggleLabel ? (
            <button
              type="button"
              className="cursor-pointer shrink-0 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
              onClick={() => setShowEnded(open => !open)}
            >
              {endedToggleLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {visibleRows.length === 0 ? (
        <div
          className={
            embedded
              ? 'flex flex-col items-center justify-center px-6 py-12 text-center'
              : 'flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-6 py-14 text-center'
          }
        >
          <h3 className="text-base font-semibold text-white">
            No current subscribers
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500">
            Canceled memberships stay on file if you need them.
          </p>
        </div>
      ) : (
        <>
      {/* Mobile: compact rows */}
      <ul
        className={`divide-y divide-white/5 md:hidden ${
          embedded
            ? ''
            : 'overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]'
        }`}
      >
        {visibleRows.map(subscriber => (
          <li key={subscriber.id}>
            <button
              type="button"
              onClick={() => openDetail(subscriber.id)}
              className="w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-white">
                  {subscriber.customerName}
                </p>
                <div className="shrink-0">
                  <StatusPill subscriber={subscriber} />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-xs text-zinc-500">
                  {hidePlanName
                    ? subscriber.cadenceLabel
                    : `${formatSubscriberPlanLabel(subscriber.planName, subscriber.planRemoved)} · ${subscriber.cadenceLabel}`}
                  {' · '}
                  {formatSubscriptionPriceCents(subscriber.amountCents)}
                </p>
                <p className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {formatSubscriberBillingDateValue({
                    status: subscriber.status,
                    cancelAtPeriodEnd: subscriber.cancelAtPeriodEnd,
                    nextBillingAt: subscriber.nextBillingAt,
                    planRemoved: subscriber.planRemoved,
                  })}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: simple table */}
      <div
        className={`hidden overflow-x-auto md:block ${
          embedded ? '' : 'rounded-lg border border-white/10 bg-white/[0.02]'
        }`}
      >
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">
                Customer
              </th>
              {!hidePlanName ? (
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">
                  Plan
                </th>
              ) : (
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">
                  Schedule
                </th>
              )}
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400">
                Amount
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">
                Next bill
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(subscriber => (
              <tr
                key={subscriber.id}
                className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                onClick={() => openDetail(subscriber.id)}
              >
                <td className="px-4 py-2.5 align-middle">
                  <p className="text-sm font-semibold tracking-tight text-white">
                    {subscriber.customerName}
                  </p>
                  {subscriber.email !== '—' ? (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {subscriber.email}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 align-middle text-sm text-zinc-300">
                  {hidePlanName ? (
                    subscriber.cadenceLabel
                  ) : (
                    <div>
                      <p className="text-zinc-200">
                        {formatSubscriberPlanLabel(
                          subscriber.planName,
                          subscriber.planRemoved
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {subscriber.cadenceLabel}
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right align-middle text-sm font-medium tabular-nums text-white">
                  {formatSubscriptionPriceCents(subscriber.amountCents)}
                </td>
                <td className="px-4 py-2.5 align-middle text-sm whitespace-nowrap text-zinc-300">
                  {formatSubscriberBillingDateValue({
                    status: subscriber.status,
                    cancelAtPeriodEnd: subscriber.cancelAtPeriodEnd,
                    nextBillingAt: subscriber.nextBillingAt,
                    planRemoved: subscriber.planRemoved,
                  })}
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <StatusPill subscriber={subscriber} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
};
