'use client';

import { Button } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { CustomerStatusBadge } from './CustomerStatusBadge';

const CUSTOMER_NOTE_MAX_LENGTH = 280;

function addOnsSummaryLine(count: number): string | null {
  if (count < 1) return null;
  return count === 1 ? '1 add-on' : `${count} add-ons`;
}

interface CustomerDetailPanelProps {
  customer: CustomerRecord;
  onClose: () => void;
  onSendLink: () => void;
  onDeleteCustomer: () => void;
  onSaveNote: (
    _note: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  isSavingNote: boolean;
  saveNoteError: string | null;
  onDismissSaveNoteError: () => void;
  formatCurrency: (_amount: number) => string;
}

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  onClose,
  onSendLink: _onSendLink,
  onDeleteCustomer,
  onSaveNote,
  isSavingNote,
  saveNoteError,
  onDismissSaveNoteError,
  formatCurrency,
}) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [noteDraft, setNoteDraft] = useState(customer.note);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const phoneHref = customerPhoneHref(customer.phone);
  const displayPhone = formatCustomerPhone(customer.phone);
  const hasCompletedVisits = customer.totalVisits > 0;
  const upcomingOnly =
    !hasCompletedVisits && Boolean(customer.nextAppointmentDate);
  const lastVisitAddOnSummary = addOnsSummaryLine(
    customer.lastBookingAddOns?.length ?? 0
  );
  const nextApptAddOnSummary = addOnsSummaryLine(
    customer.nextAppointmentAddOns?.length ?? 0
  );

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

  useEffect(() => {
    setNoteDraft(customer.note);
    setNoteSaved(false);
    setIsEditingNote(false);
  }, [customer.id, customer.note]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(customer.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      // Ignore copy errors in UI flow
    }
  };

  const handleSaveNote = async () => {
    const result = await onSaveNote(noteDraft);
    if (!result.ok) return;
    setNoteSaved(true);
    setIsEditingNote(false);
    window.setTimeout(() => setNoteSaved(false), 1500);
  };

  const noteChanged = noteDraft.trim() !== customer.note.trim();

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
                      className="inline-flex items-center justify-center p-0.5 text-gray-300 hover:text-white transition-colors md:cursor-pointer"
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
                      className="inline-flex items-center text-xs text-gray-300 underline underline-offset-2 decoration-white/40 hover:text-white hover:decoration-white/80 transition-colors"
                    >
                      {displayPhone}
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500">{displayPhone}</p>
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
              {customer.lastVisitDate && !customer.nextAppointmentDate ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Last visit
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatLastBookedDate(customer.lastVisitDate)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {customer.lastVisitDaysAgo}{' '}
                    {customer.lastVisitDaysAgo === 1 ? 'day' : 'days'} ago
                  </p>

                  <div className="my-3 border-t border-dashed border-white/[0.12]" />

                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Service
                    </p>
                    <p className="text-sm text-white font-medium">
                      {customer.lastService}
                    </p>
                    {lastVisitAddOnSummary ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {lastVisitAddOnSummary}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : !customer.nextAppointmentDate && !customer.lastVisitDate ? (
                <p className="text-sm text-gray-500">Nothing scheduled yet.</p>
              ) : null}

              {customer.nextAppointmentDate ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 font-medium">
                      {upcomingOnly
                        ? 'Upcoming appointment'
                        : 'Next appointment'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatLastBookedDate(customer.nextAppointmentDate)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatNextAppointmentRelativeDay(
                      customer.nextAppointmentDate,
                      customer.nextAppointmentDaysUntil
                    )}
                  </p>

                  <div className="my-3 border-t border-dashed border-white/[0.12]" />

                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Service
                    </p>
                    <p className="text-sm text-white font-medium">
                      {customer.nextAppointmentService ?? '—'}
                    </p>
                    {nextApptAddOnSummary ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {nextApptAddOnSummary}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {hasCompletedVisits ? (
                <>
                  <div className="my-3 border-t border-dashed border-white/[0.12]" />
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3 text-gray-400">
                      <span>Past visits</span>
                      <span className="tabular-nums">
                        {customer.totalVisits}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-gray-200 pt-1">
                      <span className="text-[11px] text-gray-400">
                        Total spent
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider flex items-center gap-2">
                <UserCircleIcon className="h-4 w-4" />
                Notes
              </h3>
              {!isEditingNote ? (
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft(customer.note);
                    setIsEditingNote(true);
                    if (saveNoteError) onDismissSaveNoteError();
                    if (noteSaved) setNoteSaved(false);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors md:cursor-pointer"
                  aria-label="Edit customer notes"
                  title="Edit notes"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              {isEditingNote ? (
                <>
                  <textarea
                    value={noteDraft}
                    onChange={e => {
                      setNoteDraft(e.target.value);
                      if (noteSaved) setNoteSaved(false);
                      if (saveNoteError) onDismissSaveNoteError();
                    }}
                    maxLength={CUSTOMER_NOTE_MAX_LENGTH}
                    placeholder="Add notes about this customer..."
                    className="w-full min-h-[120px] bg-transparent px-0 py-1.5 text-sm leading-6 text-gray-200 placeholder:text-gray-500 border-0 border-b border-white/20 focus:outline-none focus:border-white/75 transition-colors resize-y"
                  />
                  <div className="mt-3">
                    {saveNoteError ? (
                      <p className="mb-2 text-xs text-red-300">
                        {saveNoteError}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 tabular-nums">
                        {noteDraft.length}/{CUSTOMER_NOTE_MAX_LENGTH}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setNoteDraft(customer.note);
                            setIsEditingNote(false);
                            onDismissSaveNoteError();
                          }}
                          disabled={isSavingNote}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => void handleSaveNote()}
                          loading={isSavingNote}
                          disabled={!noteChanged || isSavingNote}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap">
                  {customer.note.trim() || 'No notes yet. Tap Edit to add one.'}
                </p>
              )}

              {!isEditingNote && noteSaved ? (
                <p className="text-xs text-emerald-300 mt-3">Saved</p>
              ) : null}
            </div>
          </section>

          <section className="pt-1">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
              Actions
            </h3>
            <div className="space-y-2.5">
              {/* Hidden for V2 rollout: restore send-booking CTA when flow is ready.
              <Button
                variant="secondary"
                size="sm"
                onClick={_onSendLink}
                icon={null}
                fullWidth={true}
                className="text-sm font-semibold"
              >
                Send booking link
              </Button>
              */}
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
