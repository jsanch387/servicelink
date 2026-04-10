'use client';

import { Button, GlassCard, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { useDashboardQuoteDetail } from '../hooks/useDashboardQuoteDetail';
import type { DashboardQuote } from '../types';
import {
  getCustomerEmailDisplay,
  getCustomerPhoneLink,
} from '../utils/customerContactDisplay';
import { isDashboardQuoteEditableByOwner } from '../utils/isDashboardQuoteEditableByOwner';
import { parseDeleteQuoteApiResponse } from '../utils/parseDeleteQuoteApiResponse';
import {
  getPublicQuoteAbsoluteUrl,
  getPublicQuotePath,
} from '../utils/publicQuoteUrl';
import {
  formatQuoteDetailDateLong,
  formatQuoteDetailTime12,
} from '../utils/quoteDetailFormat';
import {
  formatQuoteCurrency,
  getQuoteOutcomeDotClass,
  getQuoteStatusBlurClass,
  getQuoteStatusLabel,
} from '../utils/quoteStatusUi';
import { DeleteQuoteModalBody } from './DeleteQuoteModalBody';

interface QuoteDetailScreenProps {
  quoteId: string;
}

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({
  quoteId,
}) => {
  const router = useRouter();
  const { quote, loadStatus, loadError, reloadQuote } =
    useDashboardQuoteDetail(quoteId);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyLink = useCallback(async () => {
    if (!quote || !quote.publicToken.trim()) return;
    const url = getPublicQuoteAbsoluteUrl(quote.publicToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [quote]);

  const handleDelete = useCallback(async () => {
    if (!quote || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quote.id)}`, {
        method: 'DELETE',
      });
      const json: unknown = await res.json().catch(() => null);
      const parsed = parseDeleteQuoteApiResponse(res.ok, res.status, json);
      if (!parsed.ok) {
        setDeleteError(parsed.error);
        return;
      }
      setDeleteOpen(false);
      router.push(ROUTES.DASHBOARD.QUOTES);
      router.refresh();
    } catch {
      setDeleteError('Failed to delete quote. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [quote, deleting, router]);

  const openDeleteModal = useCallback(() => {
    setDeleteError(null);
    setDeleteOpen(true);
  }, []);

  if (loadStatus === 'loading') {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES}
            backLabel="Quotes"
          />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES}
            backLabel="Quotes"
            title="Quote not found"
            subtitle={
              loadError || 'It may have been removed or the link is invalid.'
            }
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button href={ROUTES.DASHBOARD.QUOTES} variant="secondary">
              Back to quotes
            </Button>
            <Button variant="inverse" onClick={() => void reloadQuote()}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <QuoteDetailContent
      quote={quote}
      copied={copied}
      onCopyLink={handleCopyLink}
      onOpenDelete={openDeleteModal}
      deleteOpen={deleteOpen}
      onCloseDelete={() => {
        if (!deleting) setDeleteOpen(false);
      }}
      deleting={deleting}
      deleteError={deleteError}
      onConfirmDelete={() => void handleDelete()}
    />
  );
};

interface QuoteDetailContentProps {
  quote: DashboardQuote;
  copied: boolean;
  onCopyLink: () => void;
  onOpenDelete: () => void;
  deleteOpen: boolean;
  onCloseDelete: () => void;
  deleting: boolean;
  deleteError: string | null;
  onConfirmDelete: () => void;
}

function QuoteDetailContent({
  quote,
  copied,
  onCopyLink,
  onOpenDelete,
  deleteOpen,
  onCloseDelete,
  deleting,
  deleteError,
  onConfirmDelete,
}: QuoteDetailContentProps) {
  const blur = getQuoteStatusBlurClass(quote.status);
  const outcomeDot = getQuoteOutcomeDotClass(quote.status);
  const emailDisplay = getCustomerEmailDisplay(quote.customerEmail);
  const phoneLink = getCustomerPhoneLink(quote.customerPhone);
  const hasPublicLink = Boolean(quote.publicToken.trim());
  const publicPath = getPublicQuotePath(quote.publicToken);
  const canEdit = isDashboardQuoteEditableByOwner(quote.status);

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        <QuoteFlowHeader
          backHref={ROUTES.DASHBOARD.QUOTES}
          backLabel="Quotes"
          title={quote.customerName}
          subtitle={
            quote.vehicleLine?.trim() || quote.serviceName || 'Quote details'
          }
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-sm font-medium text-gray-200 ring-1 ring-inset ring-white/10">
            {outcomeDot ? (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${outcomeDot}`}
                aria-hidden
              />
            ) : null}
            {getQuoteStatusLabel(quote.status)}
          </span>
          {quote.source === 'customer_requested' ? (
            <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-gray-400 ring-1 ring-inset ring-white/10">
              Customer request
            </span>
          ) : null}
        </div>

        <div className="space-y-4 pb-28 sm:space-y-5 sm:pb-10">
          <GlassCard
            blurColor={blur}
            rounded="rounded-2xl"
            className="border-white/[0.08] bg-white/[0.03]"
          >
            <h2 className="text-sm font-semibold text-white">Summary</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1 text-xs text-gray-500">Service</p>
                <p className="font-medium text-white">{quote.serviceName}</p>
              </div>
              {quote.note?.trim() ? (
                <>
                  <div className="h-px bg-white/10" />
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Notes</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {quote.note}
                    </p>
                  </div>
                </>
              ) : null}
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-3 py-3 sm:px-4 sm:py-3.5">
                <p className="text-sm font-medium text-gray-300">Total</p>
                <p className="text-right text-2xl font-bold tabular-nums text-white sm:text-3xl">
                  {quote.totalCents > 0
                    ? formatQuoteCurrency(quote.totalCents)
                    : 'TBD'}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            blurColor="bg-zinc-600"
            rounded="rounded-2xl"
            className="border-white/[0.08] bg-white/[0.03]"
          >
            <h2 className="text-sm font-semibold text-white">Customer</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li className="font-medium text-gray-400">
                {quote.customerName}
              </li>
              {emailDisplay ? (
                <li>
                  <a
                    href={`mailto:${emailDisplay}`}
                    className="text-gray-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-300 hover:decoration-white/30"
                  >
                    {emailDisplay}
                  </a>
                </li>
              ) : null}
              {phoneLink ? (
                <li>
                  <a
                    href={`tel:${phoneLink.tel}`}
                    className="text-gray-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-300 hover:decoration-white/30 tabular-nums"
                  >
                    {phoneLink.display}
                  </a>
                </li>
              ) : null}
            </ul>
          </GlassCard>

          {quote.vehicleLine ? (
            <GlassCard
              blurColor="bg-zinc-600"
              rounded="rounded-2xl"
              className="border-white/[0.08] bg-white/[0.03]"
            >
              <h2 className="text-sm font-semibold text-white">Vehicle</h2>
              <p className="mt-2 text-sm text-gray-300">{quote.vehicleLine}</p>
            </GlassCard>
          ) : null}

          <GlassCard
            blurColor="bg-sky-600"
            rounded="rounded-2xl"
            className="border-white/[0.08] bg-white/[0.03]"
          >
            <h2 className="text-sm font-semibold text-white">Quote link</h2>
            <p className="mt-1 text-sm text-gray-500">
              {hasPublicLink
                ? 'Send this to your customer so they can review the quote and accept or decline.'
                : 'A shareable link appears here after you send the quote.'}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasPublicLink}
                onClick={onCopyLink}
                icon={
                  copied ? (
                    <CheckIcon className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )
                }
              >
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button
                href={hasPublicLink ? publicPath : undefined}
                variant="secondary"
                size="sm"
                disabled={!hasPublicLink}
                icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              >
                View quote
              </Button>
            </div>
          </GlassCard>

          <GlassCard
            blurColor="bg-zinc-600"
            rounded="rounded-2xl"
            className="border-white/[0.08] bg-white/[0.03]"
          >
            <h2 className="text-sm font-semibold text-white">Activity</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-right text-gray-300">
                  {formatQuoteDetailDateLong(quote.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Last activity</dt>
                <dd className="text-right text-gray-300">
                  {formatQuoteDetailDateLong(quote.activityAt)}
                </dd>
              </div>
              {quote.scheduledDate ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Scheduled</dt>
                  <dd className="text-right text-gray-300">
                    {formatQuoteDetailDateLong(
                      `${quote.scheduledDate}T12:00:00`
                    )}
                    {quote.scheduledTime
                      ? ` · ${formatQuoteDetailTime12(quote.scheduledTime)}`
                      : ''}
                  </dd>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Scheduled</dt>
                  <dd className="text-right text-gray-500">Not set</dd>
                </div>
              )}
            </dl>
          </GlassCard>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              href={canEdit ? ROUTES.DASHBOARD.QUOTE_EDIT(quote.id) : undefined}
              variant="inverse"
              size="md"
              className="w-full sm:w-auto"
              disabled={!canEdit}
              title={
                canEdit
                  ? undefined
                  : 'Editing is only available before the customer accepts or declines.'
              }
            >
              Edit quote
            </Button>
            <button
              type="button"
              onClick={onOpenDelete}
              className="w-full cursor-pointer py-3 text-center text-sm font-semibold text-rose-400/90 transition-colors hover:text-rose-300 sm:w-auto sm:py-2"
            >
              Delete quote
            </button>
          </div>
        </div>

        <Modal
          isOpen={deleteOpen}
          onClose={onCloseDelete}
          title="Delete quote"
          maxWidth="sm"
        >
          <DeleteQuoteModalBody
            quote={quote}
            isDeleting={deleting}
            error={deleteError}
            onConfirm={onConfirmDelete}
            onClose={onCloseDelete}
          />
        </Modal>
      </div>
    </main>
  );
}
