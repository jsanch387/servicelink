'use client';

import { API_ROUTES } from '@/constants/routes';
import {
  getBusinessBookV2BookedUrl,
  getBusinessBookV2CartUrl,
  getBusinessBookV2DetailsUrl,
  getBusinessBookV2TimeUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import type { AppliedBookingPromo } from '@/features/availability/booking/components/BookingPromoCodeField';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { PublicBookingPolicyAgreeDialog } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { usePublicBookingPolicyAgreement } from '@/features/availability/booking/hooks/usePublicBookingPolicyAgreement';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  isValidUsZipDigits,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  depositDueNowCents,
  onlineAmountDueNowCents,
  quotePublicBookingSalesTax,
  type PublicBookingPaymentChoice,
} from '@/features/availability/booking/utils/publicBookingSalesTax';
import { isValidEmail } from '@/features/auth/utils/validation';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { computeBookingSalePricing } from '@/features/marketing/utils/computeBookingSalePricing';
import { formatPublicSaleDiscountLabel } from '@/features/marketing/utils/formatPublicSaleDiscountLabel';
import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';
import { formatUsPhoneWithCountry } from '@/lib/formatUsPhone';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  BookingV2Cart,
  BookingV2CartItem,
  BookingV2Customer,
} from '../types';
import { readBookingV2Cart } from '../utils/bookingV2Cart';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import { saveBookingV2CheckoutSnapshot } from '../utils/bookingV2Cart';
import { formatCartDollars } from '../utils/formatCartMoney';
import { bookingV2ItemDetail } from '../utils/bookingV2ItemDetail';
import { startBookingV2Payment } from '../utils/startBookingV2Payment';
import {
  formatBookingClock,
  formatBookingDay,
} from '../utils/formatBookingTime';
import { ServiceSetupHeader } from './ServiceSetupHeader';
import { BookingV2PendingState } from './BookingV2PendingState';

export type BookingReviewAddress = {
  line1: string;
  line2: string;
};

export function BookingReviewScreen({
  businessId,
  businessSlug,
  businessName,
  bookingFlowLocale,
  sale,
  paymentSettings,
  shopAddress,
  policyText = '',
  checkoutCanceled = false,
  approvalRequired = false,
}: {
  businessId: string;
  businessSlug: string;
  businessName: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  sale: PublicActiveSale | null;
  paymentSettings: PublicBookingPaymentSettings | null;
  shopAddress: BookingReviewAddress | null;
  policyText?: string;
  checkoutCanceled?: boolean;
  /** Business confirms the visit before it is booked. No card charge. */
  approvalRequired?: boolean;
}) {
  const flowUi = publicBookingUi(bookingFlowLocale);
  const ui = flowUi.bookingV2;
  const router = useRouter();
  const [cart, setCart] = useState<BookingV2Cart | null>(null);
  const [choice, setChoice] = useState<'pay_now' | 'pay_in_person'>('pay_now');
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedBookingPromo | null>(
    null
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [payError, setPayError] = useState<string | null>(
    checkoutCanceled ? flowUi.subscriptions.checkoutReturnCancel : null
  );
  const [isPaying, setIsPaying] = useState(false);
  const policyAgreement = usePublicBookingPolicyAgreement({
    businessSlug,
    policyText,
  });

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
    setCart(next);
  }, [businessSlug, bookingFlowLocale, router]);

  const canChoosePay =
    paymentSettings?.paymentsEnabled === true &&
    paymentSettings.checkoutMode === 'customer_choice';
  const payNowOnly =
    paymentSettings?.paymentsEnabled === true &&
    paymentSettings.checkoutMode === 'in_app';

  useEffect(() => {
    if (!canChoosePay && !payNowOnly) setChoice('pay_in_person');
  }, [canChoosePay, payNowOnly]);

  const totals = cart ? cartVisitTotals(cart.items) : null;
  const salePricing = useMemo(() => {
    if (!cart?.schedule || !totals) return null;
    return computeBookingSalePricing(
      totals.originalCents,
      sale,
      cart.schedule.date
    );
  }, [cart, sale, totals]);

  if (!cart?.schedule || !totals || !salePricing)
    return <BookFlowLoadingState />;

  const priceAfterDiscount = appliedPromo
    ? appliedPromo.estimatedTotalCents
    : salePricing.estimatedTotalCents;
  const discountCents = appliedPromo
    ? appliedPromo.discountCents
    : salePricing.discountCents;
  const tax = quotePublicBookingSalesTax({
    priceAfterDiscountCents: priceAfterDiscount,
    taxEnabled: paymentSettings?.taxEnabled === true,
    taxRateBps: paymentSettings?.taxRateBps ?? 0,
  });
  const showCardPay = payNowOnly || (canChoosePay && choice === 'pay_now');
  const paymentsOn =
    paymentSettings?.paymentsEnabled === true &&
    paymentSettings.checkoutMode != null;
  const customerPaymentChoice: PublicBookingPaymentChoice = showCardPay
    ? 'pay_now'
    : 'pay_in_person';
  const depositBaseCents =
    tax.taxCents > 0 ? tax.totalCents : totals.originalCents;
  const configuredDepositCents = paymentSettings
    ? depositDueNowCents({
        depositsEnabled: paymentSettings.depositsEnabled,
        depositType: paymentSettings.depositType,
        depositValue: paymentSettings.depositValue,
        totalCents: depositBaseCents,
      })
    : 0;
  const requiresDepositNow =
    paymentsOn &&
    paymentSettings?.depositsEnabled === true &&
    configuredDepositCents > 0;
  const amountDueNowCents = (() => {
    if (!paymentSettings || !paymentsOn) return 0;
    const input = {
      paymentsEnabled: true as const,
      checkoutMode: paymentSettings.checkoutMode,
      depositsEnabled: paymentSettings.depositsEnabled,
      depositType: paymentSettings.depositType,
      depositValue: paymentSettings.depositValue,
      customerPaymentChoice,
    };
    if (tax.taxCents > 0) {
      return onlineAmountDueNowCents({
        ...input,
        totalCents: tax.totalCents,
      });
    }
    const base = onlineAmountDueNowCents({
      ...input,
      totalCents: totals.originalCents,
    });
    if (showCardPay && discountCents > 0) return priceAfterDiscount;
    return base;
  })();
  const amountDueLaterCents = Math.max(0, tax.totalCents - amountDueNowCents);
  const showDepositSplit = amountDueNowCents > 0 && amountDueLaterCents > 0;
  const depositPercent =
    paymentSettings?.depositType === 'percent'
      ? Math.min(100, Math.max(0, Math.round(paymentSettings.depositValue)))
      : null;
  const depositNote = !requiresDepositNow
    ? null
    : depositPercent != null
      ? ui.depositPercentNote(businessName, depositPercent)
      : ui.depositFixedNote(
          businessName,
          formatCartDollars(configuredDepositCents)
        );
  const payLabel =
    amountDueNowCents <= 0
      ? null
      : requiresDepositNow && amountDueNowCents < tax.totalCents
        ? flowUi.calendar.payDepositAmount(formatCartDollars(amountDueNowCents))
        : ui.payWithCard(formatCartDollars(amountDueNowCents));
  const address =
    cart.serviceLocation === 'shop'
      ? shopAddress
      : customerAddress(cart.customer);
  const contactLine = [
    formatUsPhoneWithCountry(cart.customer.phone),
    cart.customer.email.trim(),
  ]
    .filter(Boolean)
    .join(' · ');
  const saleLabel =
    !appliedPromo && sale && salePricing.saleApplies
      ? saleDiscountLine(sale, flowUi.profile.saleBannerOffLabel)
      : null;
  const discountLabel = appliedPromo?.label ?? saleLabel;

  const startPayment = () => {
    if (isPaying || !cart.schedule) return;
    setPayError(null);
    policyAgreement.runAfterAgreement(() => {
      void submitPayment();
    });
  };

  const submitPayment = async () => {
    if (!cart.schedule) return;
    const kind =
      amountDueNowCents > 0 && amountDueNowCents < tax.totalCents
        ? 'deposit'
        : amountDueNowCents > 0
          ? 'paid'
          : 'later';
    saveBookingV2CheckoutSnapshot(businessSlug, {
      choice: showCardPay ? 'pay_now' : 'pay_in_person',
      amountCents: kind === 'later' ? tax.totalCents : amountDueNowCents,
      kind,
    });
    setIsPaying(true);
    const result = await startBookingV2Payment({
      businessId,
      businessSlug,
      bookingFlowLocale,
      cart,
      priceAfterDiscountCents: priceAfterDiscount,
      amountDueNowCents: approvalRequired ? 0 : amountDueNowCents,
      paymentChoice: showCardPay ? 'pay_now' : 'pay_in_person',
      promoCode: approvalRequired ? null : appliedPromo?.code,
      appointmentRequest: approvalRequired,
      deposit:
        requiresDepositNow && paymentSettings
          ? {
              type: paymentSettings.depositType,
              value: paymentSettings.depositValue,
            }
          : null,
    });
    if (!result.ok) {
      setPayError(result.error);
      setIsPaying(false);
      return;
    }
    if (!result.redirected) {
      router.push(
        getBusinessBookV2BookedUrl(businessSlug, { lang: bookingFlowLocale })
      );
    }
  };

  const applyPromo = async () => {
    if (!cart.schedule || totals.originalCents <= 0) {
      setPromoError(flowUi.calendar.promoCodeInvalid);
      return;
    }
    setPromoError(null);
    setIsApplyingPromo(true);
    try {
      const res = await fetch(API_ROUTES.PUBLIC_PROMO_CODE_VALIDATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          promoCode: promoInput,
          serviceDate: cart.schedule.date,
          subtotalCents: totals.originalCents,
          customerPhone: cart.customer.phone,
          customerEmail: cart.customer.email,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        promoCode?: string;
        label?: string;
        discountCents?: number;
        subtotalCents?: number;
        estimatedTotalCents?: number;
        errorCode?: string;
      };
      if (
        !res.ok ||
        json.success === false ||
        !json.promoCode ||
        !json.label ||
        typeof json.discountCents !== 'number' ||
        typeof json.subtotalCents !== 'number' ||
        typeof json.estimatedTotalCents !== 'number'
      ) {
        setAppliedPromo(null);
        setPromoError(promoErrorMessage(flowUi.calendar, json.errorCode));
        return;
      }
      setAppliedPromo({
        code: json.promoCode,
        label: json.label,
        discountCents: json.discountCents,
        subtotalCents: json.subtotalCents,
        estimatedTotalCents: json.estimatedTotalCents,
      });
      setPromoInput(json.promoCode);
      setPromoError(null);
    } catch {
      setAppliedPromo(null);
      setPromoError(flowUi.calendar.promoCodeInvalid);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={getBusinessBookV2DetailsUrl(businessSlug, {
          lang: bookingFlowLocale,
        })}
        backLabel={ui.back}
        step={4}
        stepTitle={ui.reviewAndPay}
      />
      <main className="flex-1 px-5 pb-10 pt-6">
        <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.6px]">
          {ui.reviewAndPay}
        </h1>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">{ui.yourBooking}</h2>
          <Link
            href={getBusinessBookV2CartUrl(businessSlug, {
              lang: bookingFlowLocale,
            })}
            className="cursor-pointer text-[15px] font-medium text-white"
          >
            {ui.edit}
          </Link>
        </div>

        <section className="mt-3 rounded-2xl border border-[#262626] bg-[#181818] px-4 py-4">
          <ul className="space-y-3">
            {cart.items.map((item, index) => (
              <li key={`${item.serviceId}-${index}`}>
                <ReviewItem item={item} />
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-3.5 border-t border-[#262626] pt-4">
            <MetaRow icon={CalendarDaysIcon}>
              <p className="text-[15px] font-medium leading-5">
                {formatBookingDay(
                  dateFromYmd(cart.schedule.date),
                  bookingFlowLocale,
                  true
                )}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-[#A3A3A3]">
                {formatBookingClock(
                  cart.schedule.time,
                  bookingFlowLocale,
                  true
                )}
                {' · '}
                {formatDurationMinutes(
                  totals.durationMinutes,
                  bookingFlowLocale
                )}
              </p>
            </MetaRow>
            {address ? (
              <MetaRow icon={MapPinIcon}>
                <p className="text-[15px] font-medium leading-5">
                  {address.line1}
                </p>
                {address.line2 ? (
                  <p className="mt-0.5 text-[13px] leading-5 text-[#A3A3A3]">
                    {address.line2}
                  </p>
                ) : null}
              </MetaRow>
            ) : null}
            <MetaRow icon={UserIcon}>
              <p className="text-[15px] font-medium leading-5">
                {cart.customer.fullName.trim()}
              </p>
              {contactLine ? (
                <p className="mt-0.5 text-[13px] leading-5 text-[#A3A3A3]">
                  {contactLine}
                </p>
              ) : null}
            </MetaRow>
          </div>
        </section>

        <h2 className="mt-7 text-[17px] font-bold">{ui.price}</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
          <div className="space-y-3 px-4 py-4">
            <PriceRow
              label={ui.subtotal}
              value={formatCartDollars(totals.originalCents)}
            />
            {discountCents > 0 && discountLabel ? (
              <PriceRow
                label={discountLabel}
                value={`−${formatCartDollars(discountCents)}`}
                tone="sale"
              />
            ) : null}
            {tax.taxCents > 0 ? (
              <PriceRow
                label={flowUi.common.salesTax(
                  formatSalesTaxRateLabel(tax.rateBps)
                )}
                value={formatCartDollars(tax.taxCents)}
              />
            ) : null}
            {!approvalRequired && appliedPromo ? (
              <button
                type="button"
                className="cursor-pointer text-[14px] font-medium text-[#A3A3A3] underline"
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoInput('');
                  setPromoError(null);
                }}
              >
                {flowUi.calendar.promoCodeRemove}
              </button>
            ) : !approvalRequired && promoOpen ? (
              <div>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={event => setPromoInput(event.target.value)}
                    placeholder={flowUi.calendar.promoCodePlaceholder}
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 rounded-xl border border-[#262626] bg-[#101010] px-3 py-2.5 text-[15px] font-normal text-white outline-none placeholder:text-[#6B6B6B]"
                  />
                  <button
                    type="button"
                    disabled={isApplyingPromo || !promoInput.trim()}
                    onClick={() => void applyPromo()}
                    className="cursor-pointer rounded-xl bg-white px-4 text-[15px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isApplyingPromo
                      ? flowUi.calendar.promoCodeApplying
                      : flowUi.calendar.promoCodeApply}
                  </button>
                </div>
                {promoError ? (
                  <p className="mt-2 text-[13px] text-[#FF6B6B]">
                    {promoError}
                  </p>
                ) : null}
              </div>
            ) : !approvalRequired ? (
              <button
                type="button"
                className="cursor-pointer text-[14px] font-semibold text-white underline"
                onClick={() => setPromoOpen(true)}
              >
                {ui.havePromoCode}
              </button>
            ) : null}
          </div>
          <div className="space-y-3 border-t border-[#262626] px-4 py-3.5">
            <PriceRow
              label={approvalRequired ? flowUi.common.estimatedTotal : ui.total}
              value={formatCartDollars(tax.totalCents)}
              total
            />
            {!approvalRequired && showDepositSplit ? (
              <>
                <PriceRow
                  label={flowUi.common.dueNow}
                  value={formatCartDollars(amountDueNowCents)}
                />
                <PriceRow
                  label={flowUi.common.remaining}
                  value={formatCartDollars(amountDueLaterCents)}
                />
              </>
            ) : null}
          </div>
        </div>
        {!approvalRequired && depositNote ? (
          <p className="mt-3 text-[13px] leading-5 text-[#A3A3A3]">
            {depositNote}
          </p>
        ) : null}

        {canChoosePay && !approvalRequired ? (
          <section className="mt-8">
            <h2 className="text-[17px] font-bold">{ui.howToPay}</h2>
            <div className="mt-3 space-y-2.5">
              <PayChoice
                selected={choice === 'pay_now'}
                title={ui.payNow}
                hint={ui.payNowHint}
                onSelect={() => setChoice('pay_now')}
              />
              <PayChoice
                selected={choice === 'pay_in_person'}
                title={ui.payInPerson}
                hint={ui.payAtAppointment}
                onSelect={() => setChoice('pay_in_person')}
              />
            </div>
          </section>
        ) : null}

        <div className="mt-8">
          {payError ? (
            <p
              className="mb-3 text-center text-[13px] text-[#FF8A80]"
              role="alert"
            >
              {payError}
            </p>
          ) : null}
          {approvalRequired ? (
            <>
              <p className="mb-3 text-center text-[13px] leading-5 text-[#A3A3A3]">
                {flowUi.calendar.requestAppointmentNote(businessName)}
              </p>
              <button
                type="button"
                onClick={startPayment}
                disabled={isPaying}
                aria-busy={isPaying}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-white px-5 text-base font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {flowUi.calendar.requestAppointment}
              </button>
            </>
          ) : payLabel ? (
            <>
              <button
                type="button"
                onClick={startPayment}
                disabled={isPaying}
                aria-busy={isPaying}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-white px-5 text-base font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {payLabel}
              </button>
              <p className="mt-3 text-center text-[13px] text-[#8F8F8F]">
                {ui.secureStripe}
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={startPayment}
              disabled={isPaying}
              aria-busy={isPaying}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-white px-5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ui.confirmBooking}
            </button>
          )}
        </div>
      </main>
      <PublicBookingPolicyAgreeDialog
        isOpen={policyAgreement.modalOpen}
        required={policyAgreement.required}
        policyText={policyAgreement.policyText}
        onClose={policyAgreement.dismiss}
        onAgreed={policyAgreement.agree}
        bookingFlowLocale={bookingFlowLocale}
      />
      {isPaying ? (
        <BookingV2PendingState
          message={
            approvalRequired
              ? ui.requestingAppointment
              : amountDueNowCents > 0
                ? ui.openingCheckout
                : ui.submittingAppointment
          }
        />
      ) : null}
    </div>
  );
}

function ReviewItem({ item }: { item: BookingV2CartItem }) {
  const addOnTotal = item.addOns.reduce(
    (sum, addOn) => sum + addOn.priceCents,
    0
  );
  const serviceCents = Math.max(0, item.originalCents - addOnTotal);
  const detail = bookingV2ItemDetail(item);
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[16px] font-semibold leading-5">
          {item.serviceName}
        </p>
        <p className="shrink-0 text-[15px] font-medium">
          {formatCartDollars(serviceCents)}
        </p>
      </div>
      {detail ? (
        <p className="mt-1 text-[13px] leading-5 text-[#A3A3A3]">{detail}</p>
      ) : null}
      {item.addOns.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {item.addOns.map(addOn => (
            <li
              key={addOn.id}
              className="flex items-start justify-between gap-3 text-[14px] leading-5 text-[#D4D4D4]"
            >
              <span>{addOn.name}</span>
              <span className="shrink-0 text-white">
                {formatCartDollars(addOn.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#A3A3A3]" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  tone = 'default',
  total = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'sale';
  total?: boolean;
}) {
  if (total) {
    return (
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[16px] font-bold text-white">{label}</span>
        <span className="shrink-0 text-[20px] font-bold tabular-nums text-white">
          {value}
        </span>
      </div>
    );
  }
  const color = tone === 'sale' ? 'text-[#3DDC6A]' : 'text-white';
  return (
    <div
      className={`flex items-start justify-between gap-3 text-[15px] font-normal ${color}`}
    >
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

function PayChoice({
  selected,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-left ${
        selected ? 'border-white bg-[#181818]' : 'border-[#262626] bg-[#181818]'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-white' : 'border-[#4A4A4A]'
        }`}
        aria-hidden
      >
        {selected ? (
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        ) : null}
      </span>
      <span>
        <span className="block text-[16px] font-semibold leading-5">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-5 text-[#8F8F8F]">
          {hint}
        </span>
      </span>
    </button>
  );
}

function customerAddress(
  customer: BookingV2Customer
): BookingReviewAddress | null {
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

function saleDiscountLine(
  sale: PublicActiveSale,
  offLabel: string
): string | null {
  const discount = formatPublicSaleDiscountLabel(
    sale.discountType,
    sale.discountValue,
    offLabel
  );
  if (!discount) return sale.name;
  return `${sale.name} · ${discount}`;
}

function promoErrorMessage(
  calendar: ReturnType<typeof publicBookingUi>['calendar'],
  errorCode: string | undefined
): string {
  switch (errorCode) {
    case 'inactive':
      return calendar.promoCodeInactive;
    case 'scheduled':
      return calendar.promoCodeScheduled;
    case 'expired':
      return calendar.promoCodeExpired;
    case 'already_used':
      return calendar.promoCodeAlreadyUsed;
    case 'identity_required':
      return calendar.promoCodeIdentityRequired;
    case 'unavailable':
      return calendar.promoCodeUnavailable;
    default:
      return calendar.promoCodeInvalid;
  }
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
