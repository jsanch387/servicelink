'use client';

import { Button, GlassCard, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import { getMockQuoteForDashboard } from '../mockQuotes';
import type { DashboardQuote } from '../types';
import { addMockDeletedQuoteId } from '../utils/mockDeletedQuoteIds';
import {
  formatQuoteCurrency,
  getQuoteOutcomeDotClass,
  getQuoteStatusBlurClass,
  getQuoteStatusLabel,
} from '../utils/quoteStatusUi';
import {
  getPublicQuoteAbsoluteUrl,
  getPublicQuotePath,
} from '../utils/publicQuoteUrl';
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import { DeleteQuoteModalBody } from './DeleteQuoteModalBody';

function formatDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

interface QuoteDetailScreenProps {
  quoteId: string;
}

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({
  quoteId,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const quote = useMemo(() => getMockQuoteForDashboard(quoteId), [quoteId]);

  const handleCopyLink = useCallback(async () => {
    if (!quote) return;
    const url = getPublicQuoteAbsoluteUrl(quote.publicToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [quote]);

  const handleDelete = useCallback(() => {
    if (!quote) return;
    setDeleting(true);
    window.setTimeout(() => {
      addMockDeletedQuoteId(quote.id);
      setDeleting(false);
      setDeleteOpen(false);
      router.push(ROUTES.DASHBOARD.QUOTES);
    }, 450);
  }, [quote, router]);

  if (!quote) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES}
            backLabel="Quotes"
            title="Quote not found"
            subtitle="It may have been removed or the link is invalid."
          />
          <Button href={ROUTES.DASHBOARD.QUOTES} variant="secondary">
            Back to quotes
          </Button>
        </div>
      </main>
    );
  }

  return (
    <QuoteDetailContent
      quote={quote}
      copied={copied}
      onCopyLink={handleCopyLink}
      onOpenDelete={() => setDeleteOpen(true)}
      deleteOpen={deleteOpen}
      onCloseDelete={() => {
        if (!deleting) setDeleteOpen(false);
      }}
      deleting={deleting}
      onConfirmDelete={handleDelete}
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
  onConfirmDelete,
}: QuoteDetailContentProps) {
  const blur = getQuoteStatusBlurClass(quote.status);
  const outcomeDot = getQuoteOutcomeDotClass(quote.status);
  const phoneDigits = quote.customerPhone?.replace(/\D/g, '') ?? '';
  const phoneDisplay = phoneDigits ? formatUsPhoneDigits(phoneDigits) : null;
  const publicPath = getPublicQuotePath(quote.publicToken);

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
              <li>
                <a
                  href={`mailto:${quote.customerEmail}`}
                  className="text-gray-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-300 hover:decoration-white/30"
                >
                  {quote.customerEmail}
                </a>
              </li>
              {phoneDisplay ? (
                <li>
                  <a
                    href={`tel:${phoneDigits}`}
                    className="text-gray-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-gray-300 hover:decoration-white/30 tabular-nums"
                  >
                    {phoneDisplay}
                  </a>
                </li>
              ) : (
                <li className="text-gray-600">No phone on file</li>
              )}
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
            <h2 className="text-sm font-semibold text-white">Customer link</h2>
            <p className="mt-1 text-xs text-gray-500">
              Share this link so they can view and respond on the web.
            </p>
            <p className="mt-3 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-gray-300">
              {publicPath}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
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
                href={publicPath}
                variant="secondary"
                size="sm"
                icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              >
                Open
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
                  {formatDateLong(quote.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Last activity</dt>
                <dd className="text-right text-gray-300">
                  {formatDateLong(quote.activityAt)}
                </dd>
              </div>
              {quote.scheduledDate ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Scheduled</dt>
                  <dd className="text-right text-gray-300">
                    {formatDateLong(`${quote.scheduledDate}T12:00:00`)}
                    {quote.scheduledTime
                      ? ` · ${formatTime12(quote.scheduledTime)}`
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
              href={ROUTES.DASHBOARD.QUOTE_EDIT(quote.id)}
              variant="inverse"
              size="md"
              className="w-full sm:w-auto"
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
            error={null}
            onConfirm={onConfirmDelete}
            onClose={onCloseDelete}
          />
        </Modal>
      </div>
    </main>
  );
}
