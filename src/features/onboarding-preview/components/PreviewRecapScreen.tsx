'use client';

import { Button, PhoneInput } from '@/components/shared';
import { AppStoreDownloadBadge } from '@/features/landing-page/components/AppStoreDownloadBadge';
import { GooglePlayDownloadBadge } from '@/features/landing-page/components/GooglePlayDownloadBadge';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { formatSamplePrice, sampleServiceForTrade } from '../sampleServices';
import { PreviewActionBar } from './PreviewActionBar';

interface PreviewRecapScreenProps {
  compact: boolean;
  showAppPitch: boolean;
  trade: string | undefined;
  phone: string;
  receiptSeen: boolean;
  linkTextSent: boolean;
  onReceiptSeen: () => void;
  onLinkTextSent: () => void;
  onDashboard: () => void;
}

export function PreviewRecapScreen({
  compact,
  showAppPitch,
  trade,
  phone,
  receiptSeen,
  linkTextSent,
  onReceiptSeen,
  onLinkTextSent,
  onDashboard,
}: PreviewRecapScreenProps) {
  const service = sampleServiceForTrade(trade);
  const [textOpen, setTextOpen] = useState(false);
  const [textPhone, setTextPhone] = useState(phone);

  return (
    <div className="onboarding-preview-rise">
      <h1
        className={
          compact
            ? 'text-2xl font-bold tracking-tight text-white'
            : 'text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl'
        }
      >
        That&apos;s what your customer just got.
      </h1>

      <ul className="mt-6 space-y-3">
        <CheckRow label="Confirmation text and email sent" />
        <CheckRow label="Job added to your calendar" />
        <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <div className="flex items-start gap-3">
            {receiptSeen ? (
              <CheckIcon
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden
              />
            ) : (
              <span
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-white/25"
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">
                Mark it done to see the receipt
              </p>
              {receiptSeen ? null : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onReceiptSeen}
                  className="mt-3"
                >
                  Mark as done
                </Button>
              )}
            </div>
          </div>
        </li>
      </ul>

      {receiptSeen ? (
        <article className="onboarding-preview-rise mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Receipt
            </h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80">
              Test
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-white">{service.name}</p>
          <p className="mt-1 text-sm text-white/60">
            Today · 9:00 AM · {service.durationLabel}
          </p>
          <p className="mt-4 text-lg font-semibold tracking-tight text-white">
            {formatSamplePrice(service.priceCents)}
          </p>
          <p className="mt-1 text-sm text-emerald-400">Paid</p>
        </article>
      ) : null}

      {showAppPitch ? (
        <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Run your business from your pocket.
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Get the ServiceLink app.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AppStoreDownloadBadge imageClassName="h-10 w-auto" />
                <GooglePlayDownloadBadge imageClassName="h-10 w-auto" />
              </div>
              {linkTextSent ? (
                <p className="mt-3 text-sm text-emerald-400">Link sent.</p>
              ) : textOpen ? (
                <div className="mt-3 max-w-sm space-y-2">
                  <PhoneInput
                    label=""
                    value={textPhone}
                    onChange={setTextPhone}
                    showDigitHint={false}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={textPhone.length !== 10}
                    onClick={onLinkTextSent}
                  >
                    Send
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setTextOpen(true)}
                  className="mt-3 cursor-pointer text-sm font-medium text-white/70 hover:text-white"
                >
                  Text me the link
                </button>
              )}
            </div>
            <AppQr />
          </div>
        </section>
      ) : null}

      <PreviewActionBar compact={compact}>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onDashboard}
          className={compact ? 'w-full' : 'w-full sm:w-auto sm:min-w-[200px]'}
        >
          Go to my dashboard
        </Button>
      </PreviewActionBar>
    </div>
  );
}

function CheckRow({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      <CheckIcon className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
      <span className="text-sm text-white">{label}</span>
    </li>
  );
}

function AppQr() {
  const size = 17;
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      cells.push(qrCell(x, y, size));
    }
  }

  return (
    <div
      role="img"
      aria-label="QR code to download the ServiceLink app"
      className="grid h-28 w-28 shrink-0 grid-cols-[repeat(17,minmax(0,1fr))] gap-px self-center rounded-xl bg-white p-2"
    >
      {cells.map((on, index) => (
        <span
          key={index}
          className={on ? 'bg-black' : 'bg-white'}
          aria-hidden
        />
      ))}
    </div>
  );
}

function qrCell(x: number, y: number, size: number): boolean {
  const finder = (originX: number, originY: number) => {
    if (x < originX || y < originY || x >= originX + 7 || y >= originY + 7) {
      return null;
    }
    const localX = x - originX;
    const localY = y - originY;
    const edge = localX === 0 || localY === 0 || localX === 6 || localY === 6;
    const core = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;
    return edge || core;
  };

  const corner = finder(0, 0) ?? finder(size - 7, 0) ?? finder(0, size - 7);
  if (corner != null) return corner;
  if ((x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)) {
    return false;
  }
  return (x * 17 + y * 13) % 5 > 2;
}
