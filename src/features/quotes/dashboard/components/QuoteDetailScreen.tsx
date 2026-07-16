'use client';

import { Button, GlassCard, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { QuoteServiceSummaryCard } from '@/features/quotes/shared/components/QuoteServiceSummaryCard';
import { resolveCustomerRequestRawText } from '@/features/quotes/shared/resolveCustomerRequestRawText';
import {
  copyTextToClipboard,
  copyTextToClipboardSync,
} from '@/lib/copyTextToClipboard';
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardQuoteDetail } from '../hooks/useDashboardQuoteDetail';
import type { DashboardQuote } from '../types';
import {
  getCustomerEmailDisplay,
  getCustomerPhoneLink,
} from '../utils/customerContactDisplay';
import { isDashboardQuoteEditableByOwner } from '../utils/isDashboardQuoteEditableByOwner';
import { parseDeleteQuoteApiResponse } from '../utils/parseDeleteQuoteApiResponse';
import { parsePublicQuoteRequestNote } from '../utils/parsePublicQuoteRequestNote';
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
import { QuoteDetailLoadingSkeleton } from './QuoteDetailLoadingSkeleton';

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
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyLink = useCallback(() => {
    if (!quote || !quote.publicToken.trim()) return;
    const url = getPublicQuoteAbsoluteUrl(quote.publicToken);

    const applyCopiedFeedback = () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = null;
      }
      setCopied(true);
      copyFeedbackTimerRef.current = setTimeout(() => {
        setCopied(false);
        copyFeedbackTimerRef.current = null;
      }, 2200);
    };

    if (copyTextToClipboardSync(url)) {
      applyCopiedFeedback();
      return;
    }
    void copyTextToClipboard(url).then(ok => {
      if (ok) applyCopiedFeedback();
    });
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
      <QuoteDetailLoadingSkeleton
        backHref={ROUTES.DASHBOARD.QUOTES}
        backLabel="Quotes"
      />
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

export interface QuoteDetailContentProps {
  quote: DashboardQuote;
  copied: boolean;
  onCopyLink: () => void;
  onOpenDelete: () => void;
  deleteOpen: boolean;
  onCloseDelete: () => void;
  deleting: boolean;
  deleteError: string | null;
  onConfirmDelete: () => void;
  backHref?: string;
  backLabel?: string;
  /** Callout below the header (e.g. sample preview). */
  infoBanner?: React.ReactNode;
  /** When set and the row is editable, used instead of the edit URL (e.g. new quote with prefill for demos). */
  primaryHrefOverride?: string;
  showDeleteButton?: boolean;
  /** Hide until a public link exists; off for mock rows with fake tokens. */
  showQuoteLinkCard?: boolean;
  /** When set, shows a “Service location” card. */
  serviceLocationLine?: string | null;
  /** When false, hides the Activity card (e.g. open quote request view). */
  showActivityCard?: boolean;
}

export function QuoteDetailContent({
  quote,
  copied,
  onCopyLink,
  onOpenDelete,
  deleteOpen,
  onCloseDelete,
  deleting,
  deleteError,
  onConfirmDelete,
  backHref = ROUTES.DASHBOARD.QUOTES,
  backLabel = 'Quotes',
  infoBanner,
  primaryHrefOverride,
  showDeleteButton = true,
  showQuoteLinkCard = true,
  serviceLocationLine,
  showActivityCard = true,
}: QuoteDetailContentProps) {
  const blur = getQuoteStatusBlurClass(quote.status);
  const outcomeDot = getQuoteOutcomeDotClass(quote.status);
  const customerNameDisplay = quote.customerName.trim() || null;
  const emailDisplay = getCustomerEmailDisplay(quote.customerEmail);
  const phoneLink = getCustomerPhoneLink(quote.customerPhone);
  const hasCustomerDetails = Boolean(
    customerNameDisplay || emailDisplay || phoneLink
  );
  const vehicleLine = quote.vehicleLine?.trim() || null;
  const hasPublicLink = Boolean(quote.publicToken.trim());
  const publicPath = getPublicQuotePath(quote.publicToken);
  const canEdit = isDashboardQuoteEditableByOwner(quote.status);
  const isPendingRequest =
    quote.source === 'customer_requested' && quote.status === 'requested';

  const primaryHref = canEdit
    ? (primaryHrefOverride ?? ROUTES.DASHBOARD.QUOTE_EDIT(quote.id))
    : undefined;

  const customerRequestRaw = resolveCustomerRequestRawText(quote);
  const parsedCustomerRequest = parsePublicQuoteRequestNote(customerRequestRaw);
  const isCustomerRequestSource = quote.source === 'customer_requested';
  const hasScheduledDate = Boolean(quote.scheduledDate?.trim());
  const timingFromRequest = parsedCustomerRequest.preferredTiming?.trim() ?? '';
  // Once the owner picks a slot, Activity shows it — don’t duplicate “Preferred time” here.
  const preferredTimingTrimmed =
    isCustomerRequestSource && timingFromRequest && !hasScheduledDate
      ? timingFromRequest
      : '';
  const customerDetailsTrimmed = isCustomerRequestSource
    ? parsedCustomerRequest.detailsOnly.trim()
    : '';
  const ownerNoteTrimmed = quote.note?.trim() ?? '';
  const showOwnerNotesOnlyBlock =
    !isCustomerRequestSource && ownerNoteTrimmed.length > 0;

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        <QuoteFlowHeader
          backHref={backHref}
          backLabel={backLabel}
          hideDividerAfterTitle
        />

        {infoBanner ? <div className="mb-4">{infoBanner}</div> : null}

        <div className="space-y-4 pb-28 sm:space-y-5 sm:pb-10">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-gray-200">Summary</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/10">
                {outcomeDot ? (
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${outcomeDot}`}
                    aria-hidden
                  />
                ) : null}
                {getQuoteStatusLabel(quote.status)}
              </span>
            </div>
            <GlassCard
              blurColor={blur}
              rounded="rounded-2xl"
              className="border-white/[0.08] bg-white/[0.03]"
            >
              <div className="space-y-4">
                <QuoteServiceSummaryCard
                  serviceName={quote.serviceName}
                  durationMinutes={quote.durationMinutes}
                  totalCents={quote.totalCents}
                  addOns={quote.addonDetails}
                />

                {hasScheduledDate && !showActivityCard ? (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Scheduled
                    </p>
                    <p className="font-medium text-white">
                      {formatQuoteDetailDateLong(
                        `${quote.scheduledDate}T12:00:00`
                      )}
                    </p>
                    {quote.scheduledTime ? (
                      <p className="mt-0.5 text-sm text-gray-400">
                        {formatQuoteDetailTime12(quote.scheduledTime)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {preferredTimingTrimmed ? (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Preferred time
                    </p>
                    <p className="text-sm font-medium text-gray-200">
                      {preferredTimingTrimmed}
                    </p>
                  </div>
                ) : null}

                {customerDetailsTrimmed ? (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="mb-1.5 text-xs font-medium text-gray-500">
                      Customer note
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {customerDetailsTrimmed}
                    </p>
                  </div>
                ) : null}

                {isCustomerRequestSource && ownerNoteTrimmed ? (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="mb-1.5 text-xs font-medium text-gray-500">
                      Your notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {ownerNoteTrimmed}
                    </p>
                  </div>
                ) : null}

                {showOwnerNotesOnlyBlock ? (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="mb-1.5 text-xs font-medium text-gray-500">
                      Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {ownerNoteTrimmed}
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5">
                  <p className="text-sm font-medium text-gray-300">Total</p>
                  <p className="text-right text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {quote.totalCents > 0
                      ? formatQuoteCurrency(quote.totalCents)
                      : 'TBD'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </section>

          {hasCustomerDetails ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-200">Customer</h2>
              <GlassCard
                blurColor="bg-zinc-600"
                rounded="rounded-2xl"
                className="border-white/[0.08] bg-white/[0.03]"
              >
                <ul className="space-y-3 text-sm">
                  {customerNameDisplay ? (
                    <li className="flex items-center gap-3 font-medium text-gray-300">
                      <UserIcon
                        className="h-4 w-4 shrink-0 text-gray-500"
                        aria-hidden
                      />
                      <span>{customerNameDisplay}</span>
                    </li>
                  ) : null}
                  {emailDisplay ? (
                    <li className="flex items-center gap-3">
                      <EnvelopeIcon
                        className="h-4 w-4 shrink-0 text-gray-500"
                        aria-hidden
                      />
                      <a
                        href={`mailto:${emailDisplay}`}
                        className="break-all text-gray-400 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-200 hover:decoration-white/30"
                      >
                        {emailDisplay}
                      </a>
                    </li>
                  ) : null}
                  {phoneLink ? (
                    <li className="flex items-center gap-3">
                      <PhoneIcon
                        className="h-4 w-4 shrink-0 text-gray-500"
                        aria-hidden
                      />
                      <a
                        href={`tel:${phoneLink.tel}`}
                        className="tabular-nums text-gray-400 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-200 hover:decoration-white/30"
                      >
                        {phoneLink.display}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </GlassCard>
            </section>
          ) : null}

          {vehicleLine ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-200">Vehicle</h2>
              <GlassCard
                blurColor="bg-zinc-600"
                rounded="rounded-2xl"
                className="border-white/[0.08] bg-white/[0.03]"
              >
                <p className="text-sm text-gray-300">{vehicleLine}</p>
              </GlassCard>
            </section>
          ) : null}

          {serviceLocationLine ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-200">
                Service location
              </h2>
              <GlassCard
                blurColor="bg-emerald-900/40"
                rounded="rounded-2xl"
                className="border-white/[0.08] bg-white/[0.03]"
              >
                <p className="text-sm text-gray-300">{serviceLocationLine}</p>
              </GlassCard>
            </section>
          ) : null}

          {showQuoteLinkCard ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-200">
                Quote link
              </h2>
              <GlassCard
                blurColor="bg-sky-600"
                rounded="rounded-2xl"
                className="border-white/[0.08] bg-white/[0.03]"
              >
                <p className="text-sm text-gray-500">
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
                    className={
                      copied
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-50 ring-1 ring-inset ring-emerald-400/30'
                        : ''
                    }
                    icon={
                      copied ? (
                        <CheckIconSolid
                          className="h-4 w-4 text-emerald-400"
                          aria-hidden
                        />
                      ) : (
                        <ClipboardDocumentIcon
                          className="h-4 w-4"
                          aria-hidden
                        />
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
            </section>
          ) : null}

          {showActivityCard ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-200">Activity</h2>
              <GlassCard
                blurColor="bg-zinc-600"
                rounded="rounded-2xl"
                className="border-white/[0.08] bg-white/[0.03]"
              >
                <dl className="space-y-3 text-sm">
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
            </section>
          ) : null}

          <div
            className={
              showDeleteButton
                ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                : 'grid grid-cols-1'
            }
          >
            <Button
              href={primaryHref}
              variant="inverse"
              size="md"
              fullWidth
              disabled={!canEdit}
              title={
                canEdit
                  ? undefined
                  : 'Editing is only available before the customer accepts or declines.'
              }
              icon={<PencilSquareIcon className="h-4 w-4" aria-hidden />}
            >
              {isPendingRequest ? 'Create quote' : 'Edit quote'}
            </Button>
            {showDeleteButton ? (
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={onOpenDelete}
                icon={<TrashIcon className="h-4 w-4" aria-hidden />}
              >
                Delete quote
              </Button>
            ) : null}
          </div>
        </div>

        {showDeleteButton ? (
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
        ) : null}
      </div>
    </main>
  );
}
