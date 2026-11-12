'use client';

import {
  API_ROUTES,
  getBusinessBookV2CartUrl,
  getBusinessBookV2DetailsUrl,
  getBusinessBookV2TimeUrl,
  getPublicBusinessProfilePath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  isValidUsZipDigits,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  onlineAmountDueNowCents,
  quotePublicBookingSalesTax,
} from '@/features/availability/booking/utils/publicBookingSalesTax';
import { isValidEmail } from '@/features/auth/utils/validation';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { computeBookingSalePricing } from '@/features/marketing/utils/computeBookingSalePricing';
import { usPhoneTelHref } from '@/lib/formatUsPhone';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { BookingV2Cart, BookingV2Customer } from '../types';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import {
  readBookingV2Cart,
  readBookingV2CheckoutSnapshot,
  type BookingV2CheckoutSnapshot,
} from '../utils/bookingV2Cart';
import {
  formatBookingClock,
  formatBookingDay,
} from '../utils/formatBookingTime';
import { bookingV2ItemDetail } from '../utils/bookingV2ItemDetail';
import { formatCartDollars } from '../utils/formatCartMoney';
import { BookingV2PendingState } from './BookingV2PendingState';

type VisitAddress = { line1: string; line2: string };

export function BookingBookedScreen({
  businessSlug,
  businessName,
  bookingFlowLocale,
  sale,
  paymentSettings,
  shopAddress,
  businessPhone,
  approvalRequired = false,
}: {
  businessSlug: string;
  businessName: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  sale: PublicActiveSale | null;
  paymentSettings: PublicBookingPaymentSettings | null;
  shopAddress: VisitAddress | null;
  businessPhone: string | null;
  /** The visit is a request until the business approves it. */
  approvalRequired?: boolean;
}) {
  const flowUi = publicBookingUi(bookingFlowLocale);
  const ui = flowUi.bookingV2;
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripeSessionId =
    searchParams.get('checkout') === 'success'
      ? (searchParams.get('session_id')?.trim() ?? '')
      : '';
  const [cart, setCart] = useState<BookingV2Cart | null>(null);
  const [payment, setPayment] = useState<BookingV2CheckoutSnapshot | null>(
    null
  );
  const [stripeSettled, setStripeSettled] = useState(false);
  const [stripeWait, setStripeWait] = useState<string | null>(null);

  useEffect(() => {
    const next = readBookingV2Cart(businessSlug);
    if (next.items.length === 0) {
      router.replace(
        getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    if (!next.schedule) {
      router.replace(
        getBusinessBookV2TimeUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    if (!isCustomerReady(next.customer, next.serviceLocation !== 'shop')) {
      router.replace(
        getBusinessBookV2DetailsUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    const saved = readBookingV2CheckoutSnapshot(businessSlug);
    const totals = cartVisitTotals(next.items);
    setPayment(
      saved ??
        quoteVisitPayment({
          originalCents: totals.originalCents,
          scheduleDate: next.schedule.date,
          sale,
          paymentSettings,
          choice: defaultPayChoice(paymentSettings),
        })
    );
    setCart(next);
  }, [businessSlug, bookingFlowLocale, paymentSettings, router, sale]);

  useEffect(() => {
    if (!stripeSessionId) {
      setStripeSettled(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const url = new URL(
        API_ROUTES.PUBLIC_BOOKING_CHECKOUT_SUMMARY,
        window.location.origin
      );
      url.searchParams.set('session_id', stripeSessionId);
      url.searchParams.set('businessSlug', businessSlug);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (cancelled) return;
        try {
          const res = await fetch(url.toString());
          const json = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            pending?: boolean;
            data?: {
              paidOnlineAmountCents?: number;
              remainingAmountCents?: number;
              totalAmountCents?: number;
              booking?: unknown;
            };
          };
          if (res.ok && json.success && json.data?.booking) {
            const paid = Math.max(0, json.data.paidOnlineAmountCents ?? 0);
            const remaining = Math.max(0, json.data.remainingAmountCents ?? 0);
            const total = Math.max(0, json.data.totalAmountCents ?? paid);
            if (!cancelled) {
              setPayment(current => ({
                choice: current?.choice ?? 'pay_now',
                amountCents: remaining > 0 ? paid : paid > 0 ? paid : total,
                kind: remaining > 0 ? 'deposit' : paid > 0 ? 'paid' : 'later',
              }));
              setStripeSettled(true);
            }
            return;
          }
          const stillProcessing =
            res.status === 202 ||
            (res.status === 404 && attempt < 7) ||
            json.pending === true;
          if (!stillProcessing) break;
        } catch {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      if (!cancelled) {
        setStripeWait(flowUi.calendar.paymentFinalizeWait);
        setStripeSettled(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [businessSlug, flowUi.calendar.paymentFinalizeWait, stripeSessionId]);

  if (stripeSessionId && !stripeSettled) {
    return <BookingV2PendingState message={ui.submittingAppointment} />;
  }

  if (!cart?.schedule || !payment) return <BookFlowLoadingState />;

  const totals = cartVisitTotals(cart.items);
  const when = `${formatBookingDay(dateFromYmd(cart.schedule.date), bookingFlowLocale)} · ${formatBookingClock(cart.schedule.time, bookingFlowLocale, true)}`;
  const address =
    cart.serviceLocation === 'shop'
      ? shopAddress
      : customerAddress(cart.customer);
  const service = serviceSummary(cart, ui.serviceCount, ui.addOnCount);
  const hasEmail = isValidEmail(cart.customer.email.trim());
  const confirmationNote = approvalRequired
    ? hasEmail
      ? flowUi.bookingSuccess.requestSubtitleCustomer(businessName)
      : flowUi.bookingSuccess.requestSubtitleCustomerNoEmail(businessName)
    : cart.customer.phone.length === 10 && hasEmail
      ? ui.textedAndEmailedConfirmation
      : hasEmail
        ? ui.emailedConfirmation
        : ui.textedConfirmation;
  const businessTel = usPhoneTelHref(businessPhone);
  const businessSms = businessTel ? businessTel.replace(/^tel:/, 'sms:') : null;
  const payLabel =
    payment.kind === 'deposit'
      ? ui.depositPaid
      : payment.kind === 'later'
        ? ui.payAtAppointment
        : ui.paid;
  const profileHref = getPublicBusinessProfilePath(businessSlug, {
    lang: bookingFlowLocale,
  });

  const addToCalendar = () => {
    downloadVisitCalendar({
      title: service.title,
      schedule: cart.schedule!,
      durationMinutes: totals.durationMinutes,
      location: address
        ? [address.line1, address.line2].filter(Boolean).join(', ')
        : '',
      businessName,
    });
  };

  return (
    <div
      className={`${bookingV2ColumnClass} min-h-screen bg-[#0F0F0F] px-5 pb-16 pt-14 text-white`}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#14301C]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3DDC6A]">
            <CheckIcon className="h-6 w-6 text-white" strokeWidth={2.5} />
          </span>
        </span>
        <h1 className="mt-5 text-[28px] font-bold leading-[1.15] tracking-[-0.6px]">
          {approvalRequired
            ? flowUi.bookingSuccess.requestTitle
            : ui.bookedTitle}
        </h1>
        <p className="mt-2 max-w-[280px] text-[15px] leading-6 text-[#A3A3A3]">
          {confirmationNote}
        </p>
        {stripeWait ? (
          <p
            className="mt-3 max-w-[320px] text-[13px] leading-5 text-[#FF8A80]"
            role="status"
          >
            {stripeWait}
          </p>
        ) : null}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
        <DetailRow
          icon={CalendarDaysIcon}
          title={when}
          detail={ui.aboutDuration(
            formatDurationMinutes(totals.durationMinutes, bookingFlowLocale)
          )}
        />
        {address ? (
          <DetailRow
            icon={MapPinIcon}
            title={address.line1}
            detail={address.line2}
            edge
          />
        ) : null}
        <DetailRow
          icon={BellIcon}
          title={service.title}
          detail={service.detail}
          edge
        />
        <div className="flex items-center gap-3 border-t border-[#262626] px-4 py-3.5">
          <CheckIcon
            className="h-5 w-5 shrink-0 text-[#3DDC6A]"
            strokeWidth={2.5}
          />
          <p
            className={`min-w-0 flex-1 text-[16px] font-semibold leading-5 ${
              approvalRequired ? 'text-white' : 'text-[#3DDC6A]'
            }`}
          >
            {approvalRequired ? flowUi.common.estimatedTotal : payLabel}
          </p>
          <p className="shrink-0 text-[16px] font-semibold tabular-nums text-white">
            {formatCartDollars(payment.amountCents)}
          </p>
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={addToCalendar}
          className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[16px] font-semibold text-black"
        >
          <CalendarDaysIcon className="h-5 w-5" aria-hidden />
          {ui.addToCalendar}
        </button>
        {businessTel && businessSms ? (
          <div className="grid grid-cols-2 gap-3">
            <a
              href={businessSms}
              className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2A2A2A] px-4 text-[15px] font-semibold text-white"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" aria-hidden />
              {ui.text}
            </a>
            <a
              href={businessTel}
              className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2A2A2A] px-4 text-[15px] font-semibold text-white"
            >
              <PhoneIcon className="h-5 w-5" aria-hidden />
              {ui.call}
            </a>
          </div>
        ) : null}
      </div>

      <Link
        href={profileHref}
        className="mt-8 block cursor-pointer text-center text-[16px] font-semibold text-white"
      >
        {ui.backToBusiness(businessName)}
      </Link>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  title,
  detail,
  edge = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  edge?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 ${edge ? 'border-t border-[#262626]' : ''}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
      <div className="min-w-0">
        <p className="text-[16px] font-semibold leading-5">{title}</p>
        {detail ? (
          <p className="mt-0.5 text-[14px] leading-5 text-[#A3A3A3]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function serviceSummary(
  cart: BookingV2Cart,
  serviceCount: (count: number) => string,
  addOnCount: (count: number) => string
): { title: string; detail: string } {
  const first = cart.items[0];
  if (!first) return { title: serviceCount(0), detail: '' };
  if (cart.items.length > 1) {
    return {
      title: serviceCount(cart.items.length),
      detail: first.serviceName,
    };
  }
  const subject = bookingV2ItemDetail(first);
  const extras = first.addOns.length;
  return {
    title: first.serviceName,
    detail: [subject, extras > 0 ? addOnCount(extras) : null]
      .filter(Boolean)
      .join(' · '),
  };
}

function defaultPayChoice(
  paymentSettings: PublicBookingPaymentSettings | null
): 'pay_now' | 'pay_in_person' {
  const mode = paymentSettings?.checkoutMode;
  if (
    paymentSettings?.paymentsEnabled === true &&
    (mode === 'in_app' || mode === 'customer_choice')
  ) {
    return 'pay_now';
  }
  return 'pay_in_person';
}

function quoteVisitPayment(input: {
  originalCents: number;
  scheduleDate: string;
  sale: PublicActiveSale | null;
  paymentSettings: PublicBookingPaymentSettings | null;
  choice: 'pay_now' | 'pay_in_person';
}): BookingV2CheckoutSnapshot {
  const salePricing = computeBookingSalePricing(
    input.originalCents,
    input.sale,
    input.scheduleDate
  );
  const tax = quotePublicBookingSalesTax({
    priceAfterDiscountCents: salePricing.estimatedTotalCents,
    taxEnabled: input.paymentSettings?.taxEnabled === true,
    taxRateBps: input.paymentSettings?.taxRateBps ?? 0,
  });
  const settings = input.paymentSettings;
  const paymentsOn =
    settings?.paymentsEnabled === true && settings.checkoutMode != null;
  const showCardPay =
    paymentsOn &&
    input.choice === 'pay_now' &&
    settings?.checkoutMode !== 'in_person';
  let amountDueNow = 0;
  if (settings && paymentsOn && settings.checkoutMode) {
    const shared = {
      paymentsEnabled: true as const,
      checkoutMode: settings.checkoutMode,
      depositsEnabled: settings.depositsEnabled,
      depositType: settings.depositType,
      depositValue: settings.depositValue,
      customerPaymentChoice: showCardPay
        ? ('pay_now' as const)
        : ('pay_in_person' as const),
    };
    if (tax.taxCents > 0) {
      amountDueNow = onlineAmountDueNowCents({
        ...shared,
        totalCents: tax.totalCents,
      });
    } else {
      const base = onlineAmountDueNowCents({
        ...shared,
        totalCents: input.originalCents,
      });
      amountDueNow =
        showCardPay && salePricing.discountCents > 0
          ? salePricing.estimatedTotalCents
          : base;
    }
  }
  const totalCents =
    tax.taxCents > 0 ? tax.totalCents : salePricing.estimatedTotalCents;
  if (amountDueNow > 0 && amountDueNow < totalCents) {
    return { choice: input.choice, amountCents: amountDueNow, kind: 'deposit' };
  }
  if (amountDueNow > 0) {
    return { choice: input.choice, amountCents: amountDueNow, kind: 'paid' };
  }
  return { choice: input.choice, amountCents: totalCents, kind: 'later' };
}

function customerAddress(customer: BookingV2Customer): VisitAddress | null {
  const line1 = [customer.streetAddress, customer.unitApt]
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ');
  const region = [customer.state.trim(), customer.zip.trim()]
    .filter(Boolean)
    .join(' ');
  const line2 = [customer.city.trim(), region].filter(Boolean).join(', ');
  if (!line1 && !line2) return null;
  return { line1: line1 || line2, line2: line1 ? line2 : '' };
}

function downloadVisitCalendar(input: {
  title: string;
  schedule: { date: string; time: string };
  durationMinutes: number;
  location: string;
  businessName: string;
}) {
  const [year, month, day] = input.schedule.date.split('-').map(Number);
  const [hours, minutes] = input.schedule.time.split(':').map(Number);
  if (!year || !month || !day) return;
  const start = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  const end = new Date(
    start.getTime() + Math.max(input.durationMinutes, 30) * 60_000
  );
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ServiceLink//Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(end)}`,
    `SUMMARY:${icsText(`${input.title} · ${input.businessName}`)}`,
    `LOCATION:${icsText(input.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const file = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'appointment.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function icsLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function isCustomerReady(
  customer: BookingV2Customer,
  needsAddress: boolean
): boolean {
  if (customer.phone.length !== 10) return false;
  if (!customer.fullName.trim()) return false;
  if (customer.fullName.trim().length > BOOKING_CUSTOMER_FULL_NAME_MAX) {
    return false;
  }
  if (
    customer.email.trim().length > 0 &&
    !isValidEmail(customer.email.trim())
  ) {
    return false;
  }
  if (!needsAddress) return true;
  return (
    Boolean(customer.streetAddress.trim()) &&
    customer.streetAddress.trim().length <= BOOKING_CUSTOMER_STREET_MAX &&
    Boolean(customer.city.trim()) &&
    customer.city.trim().length <= BOOKING_CUSTOMER_CITY_MAX &&
    customer.state.trim().length === 2 &&
    isValidUsZipDigits(customer.zip)
  );
}

function dateFromYmd(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}
