'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  GOOGLE_CONNECT_DESTINATION_LEAD,
  GOOGLE_CONNECT_DESTINATION_TITLE,
  GOOGLE_CONNECT_RETURN_CONNECTED,
  GOOGLE_CONNECT_RETURN_ERROR,
  GOOGLE_CONNECT_SECTION_LEAD,
  GOOGLE_CONNECT_SECTION_TITLE,
} from '../copy/googleConnectCopy';
import { useGoogleBusinessConnection } from '../hooks/useGoogleBusinessConnection';
import { useReviewRequestDestination } from '../hooks/useReviewRequestDestination';
import { ReviewsDashboardHeader } from './ReviewsDashboardHeader';
import { ReviewsDashboardShell } from './ReviewsDashboardShell';
import { ReviewsGoogleDisconnectModal } from './ReviewsGoogleDisconnectModal';
import { ReviewsGoogleConnectCard } from './cards/ReviewsGoogleConnectCard';
import { ReviewsRequestDestinationCard } from './cards/ReviewsRequestDestinationCard';

export const ReviewsSettingsPage: React.FC = () => {
  const {
    connected,
    loadStatus,
    connectLoading,
    connectError,
    googleReviewUrl,
    startConnect,
    disconnect,
  } = useGoogleBusinessConnection(true);
  const {
    destination: reviewDestination,
    loadStatus: destinationLoadStatus,
    saveLoading: destinationSaveLoading,
    saveError: destinationSaveError,
    setDestination,
    resetLocalDestination,
  } = useReviewRequestDestination(true);
  const [googleReturnNotice, setGoogleReturnNotice] = useState<
    'connected' | 'error' | null
  >(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const healedOrphanGoogleDestination = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get('google');
    if (google === 'connected' || google === 'error') {
      setGoogleReturnNotice(google);
      params.delete('google');
      const next = params.toString();
      const path = `${window.location.pathname}${next ? `?${next}` : ''}`;
      window.history.replaceState({}, '', path);
    }
  }, []);

  const googleKnownConnected = connected || googleReturnNotice === 'connected';

  useEffect(() => {
    if (healedOrphanGoogleDestination.current) return;
    if (loadStatus === 'loading' || destinationLoadStatus !== 'ready') return;
    if (googleKnownConnected || reviewDestination !== 'google') return;
    healedOrphanGoogleDestination.current = true;
    void setDestination('servicelink');
  }, [
    loadStatus,
    destinationLoadStatus,
    googleKnownConnected,
    reviewDestination,
    setDestination,
  ]);

  const handleConfirmDisconnect = async () => {
    const ok = await disconnect();
    if (!ok) {
      setDisconnectOpen(false);
      return;
    }
    setGoogleReturnNotice(null);
    resetLocalDestination();
    setDisconnectOpen(false);
  };

  return (
    <ReviewsDashboardShell>
      <ReviewsDashboardHeader />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-10">
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {GOOGLE_CONNECT_SECTION_TITLE}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-zinc-400">
              {GOOGLE_CONNECT_SECTION_LEAD}
            </p>
          </div>
          <ReviewsGoogleConnectCard
            connected={googleKnownConnected}
            loading={loadStatus === 'loading'}
            connectLoading={connectLoading}
            connectError={connectError}
            googleReviewUrl={googleReviewUrl}
            onConnect={() => void startConnect()}
            onDisconnect={
              googleKnownConnected
                ? () => setDisconnectOpen(true)
                : undefined
            }
          />
          {googleReturnNotice === 'connected' ? (
            <p className="text-sm text-emerald-300" role="status">
              {GOOGLE_CONNECT_RETURN_CONNECTED}
            </p>
          ) : null}
          {googleReturnNotice === 'error' ? (
            <p className="text-sm text-red-300" role="alert">
              {GOOGLE_CONNECT_RETURN_ERROR}
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {GOOGLE_CONNECT_DESTINATION_TITLE}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-zinc-400">
              {GOOGLE_CONNECT_DESTINATION_LEAD}
            </p>
          </div>
          <ReviewsRequestDestinationCard
            googleConnected={googleKnownConnected}
            value={reviewDestination}
            loading={destinationLoadStatus === 'loading'}
            disabled={destinationSaveLoading}
            onChange={destination => void setDestination(destination)}
          />
          {destinationSaveError ? (
            <p className="text-sm text-red-300" role="alert">
              {destinationSaveError}
            </p>
          ) : null}
        </section>
      </div>

      <ReviewsGoogleDisconnectModal
        isOpen={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={handleConfirmDisconnect}
      />
    </ReviewsDashboardShell>
  );
};
