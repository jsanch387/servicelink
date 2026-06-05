import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import {
  HeroBookingLinkCard,
  HeroNotificationCard,
} from './HeroFloatingCardShell';

const BOOKING_DOMAIN = 'myservicelink.app';

function FloatingAlert({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`absolute ${className}`}>{children}</div>;
}

export function HeroFloatingCards() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] hidden lg:block"
      aria-hidden
    >
      <FloatingAlert className="left-0 top-[16%] w-[230px] xl:left-3 xl:w-[250px]">
        <HeroNotificationCard
          live
          iconTone="emerald"
          label="New deposit"
          title={
            <>
              <span className="text-emerald-400">$75.00</span>
              <span className="text-white/90"> received</span>
            </>
          }
          icon={
            <BanknotesIcon className="h-5 w-5 text-emerald-400" aria-hidden />
          }
        />
      </FloatingAlert>

      <FloatingAlert className="left-0 top-[44%] w-[230px] xl:left-1 xl:w-[250px]">
        <HeroNotificationCard
          live
          label="New appointment"
          title="Mark S booked in"
          icon={<CalendarDaysIcon className="h-5 w-5 text-white" aria-hidden />}
        />
      </FloatingAlert>

      <FloatingAlert className="-right-4 top-[20%] w-[280px] xl:-right-6 xl:w-[300px]">
        <HeroBookingLinkCard
          label="Your booking link"
          domain={BOOKING_DOMAIN}
          slug="blacklabelauto"
        />
      </FloatingAlert>

      <FloatingAlert className="-right-2 top-[47%] w-[230px] xl:-right-4 xl:w-[250px]">
        <HeroNotificationCard
          label="Profile views"
          title={
            <span className="inline-flex items-center gap-1.5">
              45 views
              <ArrowTrendingUpIcon
                className="h-4 w-4 text-emerald-400"
                aria-hidden
              />
            </span>
          }
          icon={
            <ArrowTrendingUpIcon
              className="h-5 w-5 text-emerald-400"
              aria-hidden
            />
          }
        />
      </FloatingAlert>
    </div>
  );
}
