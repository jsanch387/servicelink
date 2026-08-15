'use client';

import { Button, toast } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import {
  ChevronLeftIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import type {
  OwnerSubscriber,
  OwnerSubscriptionPlan,
} from '../types/ownerSubscriptionPlan';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import { joinDescriptionAndBenefits } from '../utils/planDescription';
import { isOwnerSubscriberCountedAsActive } from '../utils/ownerSubscriberDisplay';
import { DeleteMembershipPlanModal } from './DeleteMembershipPlanModal';
import { OwnerSubscriptionsSubscribers } from './OwnerSubscriptionsSubscribers';

interface OwnerSubscriptionPlanDetailPageProps {
  plan: OwnerSubscriptionPlan;
}

/** Collapse long plan copy; expand to read the rest. */
const PLAN_DESCRIPTION_COLLAPSED_MAX_CHARS = 220;

function truncatePlanDescription(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
  const cut =
    lastBreak > Math.floor(maxChars * 0.55)
      ? slice.slice(0, lastBreak)
      : slice.trimEnd();
  return cut.trimEnd();
}

export const OwnerSubscriptionPlanDetailPage: React.FC<
  OwnerSubscriptionPlanDetailPageProps
> = ({ plan }) => {
  const description = joinDescriptionAndBenefits(
    plan.description,
    plan.benefits
  ).trim();
  const hasDescription = description.length > 0;
  const descriptionNeedsExpand =
    description.length > PLAN_DESCRIPTION_COLLAPSED_MAX_CHARS;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const visibleDescription =
    !descriptionNeedsExpand || isDescriptionExpanded
      ? description
      : truncatePlanDescription(
          description,
          PLAN_DESCRIPTION_COLLAPSED_MAX_CHARS
        );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [liveActiveCount, setLiveActiveCount] = useState<number | null>(null);

  const activeSubscriberCount = liveActiveCount ?? plan.activeSubscriberCount;
  const canDelete = activeSubscriberCount === 0;

  const handleSubscribersLoaded = useCallback((rows: OwnerSubscriber[]) => {
    setLiveActiveCount(
      rows.filter(row => isOwnerSubscriberCountedAsActive(row.status)).length
    );
  }, []);

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(API_ROUTES.MEMBERSHIPS_PLAN(plan.id), {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !json?.success) {
        setDeleteError(json?.error ?? 'Could not delete plan. Try again.');
        setIsDeleting(false);
        return;
      }

      toast.success('Plan deleted.');
      window.location.assign(ROUTES.DASHBOARD.SUBSCRIPTIONS);
    } catch {
      setDeleteError('Could not delete plan. Try again.');
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
          className="mb-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Subscriptions
        </Link>

        <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {plan.name}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {formatDurationMinutes(plan.visitDurationMinutes)}
              {' · '}
              {activeSubscriberCount === 0
                ? 'No subscribers yet'
                : activeSubscriberCount === 1
                  ? '1 active subscriber'
                  : `${activeSubscriberCount} active subscribers`}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<PencilSquareIcon className="h-4 w-4" aria-hidden />}
              href={ROUTES.DASHBOARD.SUBSCRIPTIONS_EDIT(plan.id)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="hover:bg-red-500/10 hover:text-red-300"
              icon={<TrashIcon className="h-4 w-4 text-red-400" aria-hidden />}
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        </header>

        <DeleteMembershipPlanModal
          isOpen={deleteOpen}
          planName={plan.name}
          canDelete={canDelete}
          activeSubscriberCount={activeSubscriberCount}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (!isDeleting) setDeleteOpen(false);
          }}
          onConfirm={() => void handleDelete()}
        />

        <section className="mt-6" aria-labelledby="plan-pricing-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2
              id="plan-pricing-heading"
              className="text-sm font-semibold text-white"
            >
              Pricing
            </h2>
            {plan.cadenceOptions.length > 0 ? (
              <span className="text-xs font-medium tabular-nums text-zinc-500">
                {plan.cadenceOptions.length} option
                {plan.cadenceOptions.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          {plan.cadenceOptions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-500">
              No pricing options on this plan.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <ul className="divide-y divide-white/[0.06]">
                {plan.cadenceOptions.map(option => (
                  <li
                    key={option.id}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                  >
                    <p className="min-w-0 truncate text-sm font-medium text-white">
                      {formatCadenceOptionLabel(option)}
                    </p>
                    <p className="shrink-0 text-right tabular-nums">
                      <span className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        {formatSubscriptionPriceCents(option.priceCents)}
                      </span>
                      <span className="ml-1 text-xs text-zinc-500 sm:text-sm">
                        {formatCadencePriceSuffix(option)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {hasDescription ? (
          <section className="mt-6" aria-labelledby="plan-description-heading">
            <h2
              id="plan-description-heading"
              className="mb-3 text-sm font-semibold text-white"
            >
              Description
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {visibleDescription}
                {descriptionNeedsExpand && !isDescriptionExpanded ? '…' : null}
              </div>
              {descriptionNeedsExpand ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(prev => !prev)}
                  className="mt-2 inline-flex cursor-pointer touch-manipulation text-sm font-medium text-white transition-colors hover:text-zinc-200"
                  aria-expanded={isDescriptionExpanded}
                >
                  {isDescriptionExpanded ? 'See less' : 'See more'}
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">
            No description yet.{' '}
            <Link
              href={ROUTES.DASHBOARD.SUBSCRIPTIONS_EDIT(plan.id)}
              className="cursor-pointer font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline"
            >
              Add one
            </Link>
          </p>
        )}

        <section className="mt-8" aria-labelledby="plan-subscribers-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2
              id="plan-subscribers-heading"
              className="text-sm font-semibold text-white"
            >
              Subscribers
            </h2>
            {liveActiveCount != null && liveActiveCount > 0 ? (
              <span className="text-xs font-medium tabular-nums text-zinc-500">
                {liveActiveCount} active
              </span>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <OwnerSubscriptionsSubscribers
              planIdFilter={plan.id}
              variant="embedded"
              hidePlanName
              onLoaded={handleSubscribersLoaded}
            />
          </div>
        </section>
      </div>
    </main>
  );
};
