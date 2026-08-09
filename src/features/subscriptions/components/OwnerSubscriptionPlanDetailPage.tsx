'use client';

import { Button, GlassCard, toast } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { useServiceDescriptionClamp } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { SERVICE_CARD_DESCRIPTION_CLAMP_CLASS } from '@/features/business-profile/utils/serviceDescriptionDisplay';
import { CheckIcon } from '@heroicons/react/20/solid';
import {
  ChevronLeftIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import { DeleteMembershipPlanModal } from './DeleteMembershipPlanModal';

interface OwnerSubscriptionPlanDetailPageProps {
  plan: OwnerSubscriptionPlan;
}

export const OwnerSubscriptionPlanDetailPage: React.FC<
  OwnerSubscriptionPlanDetailPageProps
> = ({ plan }) => {
  const router = useRouter();
  const description = plan.description.trim();
  const hasDescription = description.length > 0;
  const hasBenefits = plan.benefits.length > 0;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { ref: descriptionClampRef, isTruncatable } =
    useServiceDescriptionClamp(description, isDescriptionExpanded);
  const showDescriptionToggle = isTruncatable || isDescriptionExpanded;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
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
        return;
      }

      setDeleteOpen(false);
      toast.success('Plan deleted.');
      router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS);
      router.refresh();
    } catch {
      setDeleteError('Could not delete plan. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-2xl">
        <Link
          href={ROUTES.DASHBOARD.SUBSCRIPTIONS}
          className="mb-6 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Subscriptions
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {plan.name}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">No subscribers yet</p>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="!min-h-8 !rounded-md !px-3 !py-0"
              icon={<PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />}
              href={ROUTES.DASHBOARD.SUBSCRIPTIONS_EDIT(plan.id)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="!min-h-8 !rounded-md !px-3 !py-0 hover:bg-red-500/10 hover:text-red-300"
              icon={
                <TrashIcon className="h-3.5 w-3.5 text-red-400" aria-hidden />
              }
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
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (!isDeleting) setDeleteOpen(false);
          }}
          onConfirm={() => void handleDelete()}
        />

        <div className="mt-8 space-y-4">
          <GlassCard
            rounded="rounded-2xl"
            padding="none"
            className="!h-auto overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-white">Pricing</h2>
            </div>
            {plan.cadenceOptions.length === 0 ? (
              <p className="px-5 py-5 text-sm text-zinc-500 sm:px-6">
                No pricing options on this plan.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {plan.cadenceOptions.map(option => (
                  <li
                    key={option.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <p className="min-w-0 text-sm font-medium text-zinc-200">
                      {formatCadenceOptionLabel(option)}
                    </p>
                    <p className="shrink-0 text-right tabular-nums">
                      <span className="text-base font-semibold text-white sm:text-lg">
                        {formatSubscriptionPriceCents(option.priceCents)}
                      </span>
                      <span className="ml-1 text-sm text-zinc-500">
                        {formatCadencePriceSuffix(option)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard
            rounded="rounded-2xl"
            padding="none"
            className="!h-auto overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-white">Description</h2>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              {hasDescription ? (
                <div>
                  <div
                    ref={descriptionClampRef}
                    className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 ${
                      isDescriptionExpanded
                        ? ''
                        : SERVICE_CARD_DESCRIPTION_CLAMP_CLASS
                    }`.trim()}
                  >
                    {description}
                  </div>
                  {showDescriptionToggle ? (
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
              ) : (
                <p className="m-0 text-sm text-zinc-500">No description yet.</p>
              )}

              {hasBenefits ? (
                <ul className="space-y-2.5">
                  {plan.benefits.map(line => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-sm leading-snug text-zinc-300"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                        <CheckIcon
                          className="h-2.5 w-2.5 text-white"
                          aria-hidden
                        />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard
            rounded="rounded-2xl"
            padding="none"
            className="!h-auto overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-white">Subscribers</h2>
            </div>
            <div className="px-5 py-8 text-center sm:px-6">
              <p className="text-sm font-medium text-zinc-300">
                No subscribers yet
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">
                People subscribed to this plan show up here.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
};
