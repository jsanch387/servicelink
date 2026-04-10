'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useDashboardQuoteDetail } from '../hooks/useDashboardQuoteDetail';
import { formatQuoteRequestServiceLocation } from '../utils/formatQuoteRequestServiceLocation';
import { parseDeleteQuoteApiResponse } from '../utils/parseDeleteQuoteApiResponse';
import { isPendingCustomerQuoteRequest } from '../utils/pendingCustomerQuoteRequests';
import { getPublicQuoteAbsoluteUrl } from '../utils/publicQuoteUrl';
import { QuoteDetailContent } from './QuoteDetailScreen';

interface QuoteRequestDetailScreenProps {
  requestId: string;
}

export const QuoteRequestDetailScreen: React.FC<
  QuoteRequestDetailScreenProps
> = ({ requestId }) => {
  const router = useRouter();
  const id = requestId.trim();

  const {
    quote: apiQuote,
    loadStatus,
    loadError,
    reloadQuote,
  } = useDashboardQuoteDetail(id);

  useEffect(() => {
    if (loadStatus !== 'ready' || !apiQuote) return;
    if (!isPendingCustomerQuoteRequest(apiQuote)) {
      router.replace(ROUTES.DASHBOARD.QUOTE_DETAIL(apiQuote.id));
    }
  }, [loadStatus, apiQuote, router]);

  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyLink = useCallback(async () => {
    if (!apiQuote || !apiQuote.publicToken.trim()) return;
    const url = getPublicQuoteAbsoluteUrl(apiQuote.publicToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [apiQuote]);

  const handleDelete = useCallback(async () => {
    if (!apiQuote || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/quotes/${encodeURIComponent(apiQuote.id)}`,

        {
          method: 'DELETE',
        }
      );
      const json: unknown = await res.json().catch(() => null);
      const parsed = parseDeleteQuoteApiResponse(res.ok, res.status, json);
      if (!parsed.ok) {
        setDeleteError(parsed.error);
        return;
      }
      setDeleteOpen(false);
      router.push(ROUTES.DASHBOARD.QUOTES_REQUESTS);
      router.refresh();
    } catch {
      setDeleteError('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [apiQuote, deleting, router]);

  const openDeleteModal = useCallback(() => {
    setDeleteError(null);
    setDeleteOpen(true);
  }, []);

  if (loadStatus === 'loading') {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES_REQUESTS}
            backLabel="Requests"
          />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          </div>
        </div>
      </main>
    );
  }

  if (loadStatus === 'error') {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES_REQUESTS}
            backLabel="Requests"
            title="Couldn’t load request"
            subtitle={loadError || 'Something went wrong.'}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button href={ROUTES.DASHBOARD.QUOTES_REQUESTS} variant="secondary">
              Back to requests
            </Button>
            <Button variant="inverse" onClick={() => void reloadQuote()}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (loadStatus === 'ready' && !apiQuote) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTES_REQUESTS}
            backLabel="Requests"
            title="Request not found"
            subtitle="It may have been removed or the link is invalid."
          />
          <Button href={ROUTES.DASHBOARD.QUOTES_REQUESTS} variant="secondary">
            Back to requests
          </Button>
        </div>
      </main>
    );
  }

  if (
    loadStatus === 'ready' &&
    apiQuote &&
    !isPendingCustomerQuoteRequest(apiQuote)
  ) {
    return null;
  }

  if (!apiQuote) {
    return null;
  }

  const serviceLocationLine = formatQuoteRequestServiceLocation(apiQuote);

  return (
    <QuoteDetailContent
      quote={apiQuote}
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
      backHref={ROUTES.DASHBOARD.QUOTES_REQUESTS}
      backLabel="Requests"
      headerSubtitle={`${apiQuote.serviceName || 'Request'} · Awaiting your quote`}
      showDeleteButton
      showQuoteLinkCard={false}
      showActivityCard={false}
      serviceLocationLine={serviceLocationLine}
    />
  );
};
