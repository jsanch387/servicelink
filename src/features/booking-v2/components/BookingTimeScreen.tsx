'use client';

import {
  getBusinessBookV2CartUrl,
  getBusinessBookV2DetailsUrl,
  getBusinessBookV2PlaceUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import {
  findEarliestAvailableSlot,
  generateTimeSlots,
  parseTimeHHmm,
} from '@/features/availability/booking/utils/slotGeneration';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import type {
  ExistingBooking,
  TimeOffInterval,
} from '@/features/availability/booking/types';
import { toLocalYYYYMMDD } from '@/features/availability/utils/minimumNotice';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  CalendarDaysIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BookingV2Cart, BookingV2Schedule } from '../types';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import {
  readBookingV2Cart,
  saveBookingV2Schedule,
} from '../utils/bookingV2Cart';
import {
  formatBookingClock,
  formatBookingDay,
} from '../utils/formatBookingTime';
import { formatCartDollars } from '../utils/formatCartMoney';
import { BookingTimeCalendar } from './BookingTimeCalendar';
import { BookingV2ContinueFooter } from './BookingV2ContinueFooter';
import { ServiceSetupHeader } from './ServiceSetupHeader';

export function BookingTimeScreen({
  businessSlug,
  bookingFlowLocale,
  weeklySchedule,
  timeOffBlocks,
  minimumNotice,
  bufferTime,
  locationChoiceRequired = false,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  weeklySchedule: WeeklySchedule | null;
  timeOffBlocks: TimeOffInterval[];
  minimumNotice: string;
  bufferTime: string;
  /** Shop and mobile are both offered, so a place must be chosen first. */
  locationChoiceRequired?: boolean;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const router = useRouter();
  const { blockedSlots, loading: slotsLoading } =
    usePublicBlockedSlots(businessSlug);
  const [cart, setCart] = useState<BookingV2Cart | null>(null);
  const [selected, setSelected] = useState<BookingV2Schedule | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [slotsSettled, setSlotsSettled] = useState(false);
  const sawSlotLoad = useRef(false);
  const cartReady = useRef(false);
  const userChose = useRef(false);

  const durationMinutes = cart
    ? cartVisitTotals(cart.items).durationMinutes
    : 0;

  const earliest = useMemo(() => {
    if (!weeklySchedule || durationMinutes < 1) return null;
    return findEarliestAvailableSlot({
      weeklySchedule,
      serviceDurationMinutes: durationMinutes,
      existingBookings: blockedSlots,
      timeOffBlocks,
      minimumNotice,
      bufferTime,
    });
  }, [
    weeklySchedule,
    durationMinutes,
    blockedSlots,
    timeOffBlocks,
    minimumNotice,
    bufferTime,
  ]);

  useEffect(() => {
    if (slotsLoading) sawSlotLoad.current = true;
    else if (sawSlotLoad.current) setSlotsSettled(true);
  }, [slotsLoading]);

  useEffect(() => {
    if (!slotsSettled || cartReady.current) return;
    const nextCart = readBookingV2Cart(businessSlug);
    if (nextCart.items.length === 0) {
      router.replace(
        getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    if (locationChoiceRequired && !nextCart.serviceLocation) {
      router.replace(
        getBusinessBookV2PlaceUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    cartReady.current = true;
    setCart(nextCart);
  }, [
    slotsSettled,
    businessSlug,
    bookingFlowLocale,
    locationChoiceRequired,
    router,
  ]);

  useEffect(() => {
    if (!cart || !earliest || !weeklySchedule || userChose.current) return;
    const saved = cart.schedule;
    if (
      saved &&
      dayHasSlot(
        saved,
        weeklySchedule,
        durationMinutes,
        blockedSlots,
        timeOffBlocks,
        minimumNotice,
        bufferTime
      )
    ) {
      userChose.current = true;
      setSelected(saved);
      setVisibleMonth(startOfMonth(dateFromYmd(saved.date)));
      return;
    }
    const next = {
      date: toLocalYYYYMMDD(earliest.date),
      time: earliest.time,
    };
    setSelected(current =>
      current?.date === next.date && current.time === next.time ? current : next
    );
    setVisibleMonth(startOfMonth(earliest.date));
    saveBookingV2Schedule(businessSlug, next);
  }, [
    cart,
    earliest,
    businessSlug,
    weeklySchedule,
    durationMinutes,
    blockedSlots,
    timeOffBlocks,
    minimumNotice,
    bufferTime,
  ]);

  const selectedDate = selected ? dateFromYmd(selected.date) : null;
  const slots = useMemo(() => {
    if (!selectedDate || !weeklySchedule || durationMinutes < 1) return [];
    return generateTimeSlots(
      selectedDate,
      weeklySchedule,
      durationMinutes,
      blockedSlots,
      30,
      timeOffBlocks,
      minimumNotice,
      { bufferTime }
    );
  }, [
    selectedDate,
    weeklySchedule,
    durationMinutes,
    blockedSlots,
    timeOffBlocks,
    minimumNotice,
    bufferTime,
  ]);

  if (!cart || !slotsSettled) return <BookFlowLoadingState />;

  const totals = cartVisitTotals(cart.items);
  const cartHref = getBusinessBookV2CartUrl(businessSlug, {
    lang: bookingFlowLocale,
  });
  const summary = visitSummary(cart, bookingFlowLocale, ui.serviceCount);
  const soonest =
    earliest &&
    selected &&
    selected.date === toLocalYYYYMMDD(earliest.date) &&
    selected.time === earliest.time;
  const todayMonth = startOfMonth(new Date());
  const groups = groupSlots(slots);

  const choose = (date: Date, time: string) => {
    userChose.current = true;
    const next = { date: toLocalYYYYMMDD(date), time };
    setSelected(next);
    setVisibleMonth(startOfMonth(date));
    saveBookingV2Schedule(businessSlug, next);
  };

  const chooseDay = (date: Date) => {
    if (!weeklySchedule) return;
    const daySlots = generateTimeSlots(
      date,
      weeklySchedule,
      durationMinutes,
      blockedSlots,
      30,
      timeOffBlocks,
      minimumNotice,
      { bufferTime }
    );
    if (daySlots[0]) choose(date, daySlots[0]);
  };

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={
          locationChoiceRequired
            ? getBusinessBookV2PlaceUrl(businessSlug, {
                lang: bookingFlowLocale,
              })
            : cartHref
        }
        backLabel={ui.back}
        step={2}
        stepTitle={ui.dateTimeStep}
      />
      <main className="flex flex-1 flex-col gap-6 px-5 pb-36 pt-6">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.6px]">
            {ui.pickATime}
          </h1>
          <Link
            href={cartHref}
            className="mt-0.5 inline-flex max-w-full cursor-pointer items-center gap-1 text-[15px] text-[#A3A3A3]"
          >
            <span className="truncate">{summary}</span>
            <ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>

        {!weeklySchedule || !earliest ? (
          <p className="text-[15px] text-[#A3A3A3]">{ui.noOpenTimes}</p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => choose(earliest.date, earliest.time)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 bg-[#181818] px-3.5 py-3 text-left ${
                soonest ? 'border-white' : 'border-[#262626]'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2A2A2A] text-white">
                <CalendarDaysIcon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                {soonest ? (
                  <span className="block text-[13px] font-semibold leading-4 text-[#3DDC6A]">
                    {ui.soonestAvailable}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-[16px] font-semibold leading-5 text-white">
                  {formatBookingDay(
                    dateFromYmd(
                      selected?.date ?? toLocalYYYYMMDD(earliest.date)
                    ),
                    bookingFlowLocale
                  )}
                  {' · '}
                  {formatBookingClock(
                    selected?.time ?? earliest.time,
                    bookingFlowLocale,
                    true
                  )}
                </span>
              </span>
              {soonest ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-black">
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full border border-[#4A4A4A]" />
              )}
            </button>

            <section className="flex flex-col gap-3">
              <h2 className="text-[17px] font-semibold leading-5 text-white">
                {ui.orPickAnotherDay}
              </h2>
              <BookingTimeCalendar
                visibleMonth={visibleMonth}
                selectedYmd={selected?.date ?? null}
                isDayOpen={date =>
                  generateTimeSlots(
                    date,
                    weeklySchedule,
                    durationMinutes,
                    blockedSlots,
                    30,
                    timeOffBlocks,
                    minimumNotice,
                    { bufferTime }
                  ).length > 0
                }
                canGoBack={visibleMonth.getTime() > todayMonth.getTime()}
                bookingFlowLocale={bookingFlowLocale}
                previousMonthLabel={ui.previousMonth}
                nextMonthLabel={ui.nextMonth}
                onVisibleMonth={setVisibleMonth}
                onSelectDay={chooseDay}
              />
            </section>

            <SlotGroups
              groups={groups}
              selectedTime={selected?.time ?? null}
              bookingFlowLocale={bookingFlowLocale}
              labels={{
                morning: ui.morning,
                afternoon: ui.afternoon,
                evening: ui.evening,
              }}
              onSelect={time => {
                if (selectedDate) choose(selectedDate, time);
              }}
            />
          </>
        )}
      </main>
      {selected ? (
        <BookingV2ContinueFooter
          primary={`${formatBookingDay(dateFromYmd(selected.date), bookingFlowLocale)} · ${formatBookingClock(selected.time, bookingFlowLocale, true)}`}
          secondary={`${formatCartDollars(totals.dueCents)} · ${formatDurationMinutes(durationMinutes, bookingFlowLocale)}`}
          continueLabel={ui.continue}
          onContinue={() =>
            router.push(
              getBusinessBookV2DetailsUrl(businessSlug, {
                lang: bookingFlowLocale,
              })
            )
          }
        />
      ) : null}
    </div>
  );
}

function SlotGroups({
  groups,
  selectedTime,
  bookingFlowLocale,
  labels,
  onSelect,
}: {
  groups: { morning: string[]; afternoon: string[]; evening: string[] };
  selectedTime: string | null;
  bookingFlowLocale: PublicBookingFlowLocale;
  labels: { morning: string; afternoon: string; evening: string };
  onSelect: (time: string) => void;
}) {
  const sections = [
    ['morning', groups.morning, labels.morning],
    ['afternoon', groups.afternoon, labels.afternoon],
    ['evening', groups.evening, labels.evening],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {sections.map(([key, times, label]) =>
        times.length === 0 ? null : (
          <section key={key}>
            <h3 className="mb-2.5 text-[15px] font-medium text-[#A3A3A3]">
              {label}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {times.map(time => {
                const active = time === selectedTime;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onSelect(time)}
                    className={`h-11 cursor-pointer rounded-xl text-[15px] font-semibold ${
                      active
                        ? 'bg-white text-black'
                        : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                    }`}
                  >
                    {formatBookingClock(time, bookingFlowLocale, false)}
                  </button>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}

function visitSummary(
  cart: BookingV2Cart,
  locale: PublicBookingFlowLocale,
  serviceCount: (count: number) => string
): string {
  const duration = formatDurationMinutes(
    cartVisitTotals(cart.items).durationMinutes,
    locale
  );
  const first = cart.items[0];
  if (!first || cart.items.length !== 1) {
    return `${serviceCount(cart.items.length)} · ${duration}`;
  }
  return [first.serviceName, duration].filter(Boolean).join(' · ');
}

function groupSlots(slots: string[]): {
  morning: string[];
  afternoon: string[];
  evening: string[];
} {
  return {
    morning: slots.filter(time => parseTimeHHmm(time) < 12 * 60),
    afternoon: slots.filter(time => {
      const minutes = parseTimeHHmm(time);
      return minutes >= 12 * 60 && minutes < 17 * 60;
    }),
    evening: slots.filter(time => parseTimeHHmm(time) >= 17 * 60),
  };
}

function dayHasSlot(
  schedule: BookingV2Schedule,
  weeklySchedule: WeeklySchedule,
  durationMinutes: number,
  blockedSlots: ExistingBooking[],
  timeOffBlocks: TimeOffInterval[],
  minimumNotice: string,
  bufferTime: string
): boolean {
  if (durationMinutes < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(schedule.date)) {
    return false;
  }
  const slots = generateTimeSlots(
    dateFromYmd(schedule.date),
    weeklySchedule,
    durationMinutes,
    blockedSlots,
    30,
    timeOffBlocks,
    minimumNotice,
    { bufferTime }
  );
  return slots.includes(schedule.time);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateFromYmd(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}
