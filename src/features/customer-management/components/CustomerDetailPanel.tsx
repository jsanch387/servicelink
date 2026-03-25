'use client';

import { Button } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface CustomerDetailPanelProps {
  customer: CustomerRecord;
  onClose: () => void;
  onSendLink: () => void;
  onDeleteCustomer: () => void;
  formatCurrency: (_amount: number) => string;
}

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  onClose,
  onSendLink,
  onDeleteCustomer,
  formatCurrency,
}) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const phoneHref = customerPhoneHref(customer.phone);
  const displayPhone = formatCustomerPhone(customer.phone);

  useEffect(() => {
    const scrollY = window.scrollY;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    // iOS-safe body lock: freeze page position and keep scrolling inside panel only.
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(customer.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      // Ignore copy errors in UI flow
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:shadow-2xl bg-[#0f0f0f] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Back to customer list"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2
            id="customer-detail-title"
            className="text-lg font-bold text-white truncate flex-1"
          >
            Customer details
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">
          <section className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">
                  {customer.name}
                </p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-300">{customer.email}</p>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-gray-300 hover:text-white hover:border-white/25 transition-colors"
                      aria-label="Copy customer email"
                      title="Copy email"
                    >
                      <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    </button>
                    {emailCopied && (
                      <span className="text-[11px] text-emerald-300">
                        Copied
                      </span>
                    )}
                  </div>
                  {phoneHref ? (
                    <a
                      href={phoneHref}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {displayPhone}
                    </a>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {displayPhone}
                    </p>
                  )}
                </div>
              </div>
              <CustomerStatusBadge status={customer.status} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              Booking activity
            </h3>
            <div className="rounded-xl bg-[#111111] border border-white/[0.08] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500 font-medium">
                  Last booking
                </p>
                <p className="text-xs text-gray-400">
                  {formatLastBookedDate(customer.lastBookingDate)}
                </p>
              </div>

              <div className="my-3 border-t border-dashed border-white/[0.12]" />

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-white font-medium pr-2">
                    {customer.lastService}
                  </p>
                  <p className="text-sm text-gray-200 tabular-nums whitespace-nowrap">
                    {typeof customer.lastServicePrice === 'number'
                      ? formatCurrency(customer.lastServicePrice)
                      : '—'}
                  </p>
                </div>

                {customer.lastBookingAddOns?.map((addon, index) => (
                  <div
                    key={`${addon}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="text-sm text-gray-300 flex items-center gap-1.5 min-w-0">
                      <PlusIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{addon}</span>
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                      {customer.lastBookingAddOnDetails?.[index]
                        ? formatCurrency(
                            customer.lastBookingAddOnDetails[index].price
                          )
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-3 border-t border-dashed border-white/[0.12]" />

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3 text-gray-400">
                  <span>Last booked</span>
                  <span>{customer.lastBookingDaysAgo} days ago</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-gray-400">
                  <span>Total visits</span>
                  <span className="tabular-nums">{customer.totalVisits}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-gray-200 pt-1">
                  <span className="text-[11px] text-gray-400">
                    Lifetime spent
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <UserCircleIcon className="h-4 w-4" />
              Notes
            </h3>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-sm text-gray-300">{customer.note}</p>
            </div>
          </section>

          <section className="pt-1">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
              Actions
            </h3>
            <div className="space-y-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={onSendLink}
                icon={
                  <PaperAirplaneIcon className="h-4 w-4 text-emerald-400" />
                }
                fullWidth={true}
                className="text-sm font-semibold"
              >
                Send booking link
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteCustomer}
                icon={<TrashIcon className="h-4 w-4" />}
                fullWidth={true}
                className="text-sm font-medium"
              >
                Delete customer
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};
