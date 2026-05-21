'use client';

import { Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  ANALYTICS_PERIOD_LABELS,
  DASHBOARD_LINK_VIEWS_PERIODS,
  isProOnlyLinkViewsPeriod,
  type DashboardLinkViewsPeriod,
} from '@/features/analytics/constants';
import { ProFeatureLabel } from '@/features/dashboard/components/ProFeatureLabel';
import { dashboardCardButtonClass } from '../utils/dashboardCardStyles';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface LinkViewsPeriodPickerProps {
  period: DashboardLinkViewsPeriod;
  onPeriodChange: (period: DashboardLinkViewsPeriod) => void;
  /** When true, 7d and 30d are visible but locked with Pro upsell */
  isFreeTier?: boolean;
}

const PERIOD_TRIGGER_LABEL: Record<DashboardLinkViewsPeriod, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
};

function useIsDesktopPicker() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export const LinkViewsPeriodPicker: React.FC<LinkViewsPeriodPickerProps> = ({
  period,
  onPeriodChange,
  isFreeTier = false,
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktopPicker();

  const selectPeriod = (next: DashboardLinkViewsPeriod) => {
    onPeriodChange(next);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`cursor-pointer inline-flex min-h-11 max-w-[10rem] sm:max-w-[11rem] items-center justify-center gap-1.5 rounded-lg px-3 sm:px-3.5 text-xs sm:text-sm font-semibold ${dashboardCardButtonClass}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Time range: ${ANALYTICS_PERIOD_LABELS[period]}. Tap to change.`}
      >
        <span className="truncate">{PERIOD_TRIGGER_LABEL[period]}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title=""
        maxWidth="sm"
        presentation={isDesktop ? 'default' : 'sheet'}
        uniformHorizontalPadding16
        contentClassName={
          isDesktop
            ? '!pt-4 !pb-6'
            : '!pt-2 !pb-[max(1.25rem,env(safe-area-inset-bottom))]'
        }
      >
        {!isDesktop ? (
          <div className="flex justify-center pb-3" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-white/25" />
          </div>
        ) : null}
        <h3 className="text-lg font-semibold text-white tracking-tight">
          Time range
        </h3>
        <p className="mt-1 mb-4 text-sm text-zinc-500">
          Link views for the selected period
        </p>
        <ul className="space-y-2" role="listbox" aria-label="Time range">
          {DASHBOARD_LINK_VIEWS_PERIODS.map(option => {
            const selected = period === option;
            const locked = isFreeTier && isProOnlyLinkViewsPeriod(option);

            if (locked) {
              return (
                <li key={option}>
                  <Link
                    href={ROUTES.DASHBOARD.UPGRADE}
                    onClick={() => setOpen(false)}
                    className="flex w-full min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-left opacity-70 transition-colors hover:bg-white/[0.04] hover:opacity-80"
                    role="option"
                    aria-disabled="true"
                    aria-label={`${ANALYTICS_PERIOD_LABELS[option]} — Pro feature`}
                  >
                    <span className="text-base font-medium text-zinc-500">
                      {ANALYTICS_PERIOD_LABELS[option]}
                    </span>
                    <ProFeatureLabel />
                  </Link>
                </li>
              );
            }

            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectPeriod(option)}
                  className={`cursor-pointer flex w-full min-h-[52px] items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors ${
                    selected
                      ? 'border-white/20 bg-white/[0.08] text-white'
                      : 'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] active:bg-white/[0.06]'
                  }`}
                >
                  <span>{ANALYTICS_PERIOD_LABELS[option]}</span>
                  {selected ? (
                    <CheckIcon
                      className="h-5 w-5 shrink-0 text-emerald-400"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
};
