import { Button } from '@/components/shared';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { formatBusinessProfileLinkLabel } from '@/features/availability/booking/server/buildInvoiceSnapshot';
import { SubscriptionSuccessCheckmark } from '@/features/subscriptions/components/SubscriptionSuccessCheckmark';
import {
  BuildingStorefrontIcon,
  LockClosedIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatPaymentLinkAmount } from './formatPaymentLinkAmount';
import type { PublicPaymentLinkRecord } from './loadPublicPaymentRequestByShortCode';
import { WALKUP_PAYMENT_STATUS } from './constants';

export function PublicPaymentLinkPage({
  payment,
}: {
  payment: PublicPaymentLinkRecord;
}) {
  const amount = formatPaymentLinkAmount(payment.amountCents);

  if (payment.status === WALKUP_PAYMENT_STATUS.PAID) {
    return (
      <PaymentLinkChrome payment={payment} center>
        <PaymentLinkStatus
          tone="success"
          title="Already paid"
          body="This charge was already collected. You can close this page."
        />
      </PaymentLinkChrome>
    );
  }

  if (payment.status === WALKUP_PAYMENT_STATUS.EXPIRED) {
    return (
      <PaymentLinkChrome payment={payment} center>
        <PaymentLinkStatus
          tone="error"
          title="This link expired"
          body={`Payment links last 24 hours. Ask ${payment.businessName} for a new one.`}
        />
      </PaymentLinkChrome>
    );
  }

  if (
    payment.status === WALKUP_PAYMENT_STATUS.CANCELED ||
    payment.status === WALKUP_PAYMENT_STATUS.FAILED ||
    !payment.checkoutUrl
  ) {
    return (
      <PaymentLinkChrome payment={payment} center>
        <PaymentLinkStatus
          tone="error"
          title="Link unavailable"
          body={`This payment link is no longer active. Ask ${payment.businessName} for a new one.`}
        />
      </PaymentLinkChrome>
    );
  }

  return (
    <PaymentLinkChrome payment={payment}>
      <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_18px_50px_-24px_rgba(20,18,16,0.45)]">
        <div className="px-6 pb-2 pt-8 text-center sm:px-8">
          <BusinessMark name={payment.businessName} logoUrl={payment.logoUrl} />
          <p className="mt-4 text-sm text-neutral-500">
            {payment.businessName} requested a payment
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-neutral-950">
            {amount}
          </p>
        </div>

        <div className="mx-6 my-6 border-t border-dashed border-neutral-200 sm:mx-8" />

        <div className="space-y-3 px-6 pb-2 sm:px-8">
          <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-neutral-500">For</span>
            <span className="max-w-[70%] text-right font-medium text-neutral-900">
              {payment.note}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-neutral-500">Total due</span>
            <span className="font-semibold text-neutral-950">{amount}</span>
          </div>
        </div>

        <div className="px-6 pb-7 pt-6 sm:px-8">
          <Button
            href={payment.checkoutUrl}
            variant="primary"
            size="lg"
            fullWidth
            className="!bg-[#141210] !text-[#f7f4ee] hover:!bg-black"
          >
            Pay {amount}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <LockClosedIcon className="h-3.5 w-3.5" aria-hidden />
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </PaymentLinkChrome>
  );
}

function PaymentLinkChrome({
  children,
  payment,
  center = false,
}: {
  children: ReactNode;
  payment: PublicPaymentLinkRecord;
  center?: boolean;
}) {
  const header = (
    <header className="border-b border-white/10 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center gap-2.5"
        >
          <Image
            src={MARKETING_IMAGES.brand.logo}
            alt="ServiceLink"
            width={140}
            height={28}
            className="h-7 w-auto brightness-0 invert"
            priority
          />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gray-400 sm:text-[13px]">
          <LockClosedIcon className="h-3.5 w-3.5" aria-hidden />
          Secure checkout
        </span>
      </div>
    </header>
  );

  const footer = (
    <footer className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm leading-relaxed text-gray-500">
          Any issues or questions? Contact {payment.businessName}.
        </p>
        {payment.bookingUrl ? (
          <a
            href={payment.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block cursor-pointer py-1 text-sm text-gray-400 underline underline-offset-2 hover:text-white"
          >
            {formatBusinessProfileLinkLabel(payment.bookingUrl)}
          </a>
        ) : null}
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <Link
            href="/"
            className="group inline-flex cursor-pointer items-center gap-2 text-gray-500 transition-colors hover:text-gray-300"
          >
            <span className="text-xs">Powered by</span>
            <Image
              src={MARKETING_IMAGES.brand.favicon}
              alt=""
              width={14}
              height={14}
              className="opacity-70 transition-opacity group-hover:opacity-100"
            />
            <span className="text-sm font-medium text-gray-400 transition-colors group-hover:text-white">
              ServiceLink
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );

  if (center) {
    return (
      <div className="relative min-h-[100dvh] bg-[var(--dashboard-bg)] text-white">
        <div className="absolute inset-x-0 top-0 z-10">{header}</div>
        <main className="flex min-h-[100dvh] items-center justify-center px-4 py-28">
          <div className="w-full max-w-lg">{children}</div>
        </main>
        <div className="absolute inset-x-0 bottom-0 z-10">{footer}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--dashboard-bg)] text-white">
      {header}
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>
      {footer}
    </div>
  );
}

function BusinessMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={64}
        height={64}
        unoptimized
        className="mx-auto h-16 w-16 rounded-2xl object-cover ring-1 ring-black/10"
      />
    );
  }

  return (
    <span
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#efeae2] text-[#6f6a62] ring-1 ring-black/5"
      aria-hidden
    >
      <BuildingStorefrontIcon className="h-7 w-7" />
      <span className="sr-only">{name}</span>
    </span>
  );
}

function PaymentLinkStatus({
  tone,
  title,
  body,
}: {
  tone: 'success' | 'error';
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/[0.06] bg-white px-6 py-8 text-center shadow-[0_18px_50px_-24px_rgba(20,18,16,0.45)]">
      <div className="flex justify-center">
        {tone === 'error' ? (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50"
            aria-hidden
          >
            <XCircleIcon className="h-7 w-7 text-rose-500" />
          </div>
        ) : (
          <div className="origin-center scale-90">
            <SubscriptionSuccessCheckmark />
          </div>
        )}
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
        {body}
      </p>
    </div>
  );
}
