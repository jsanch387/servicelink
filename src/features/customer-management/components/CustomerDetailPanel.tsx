'use client';

import { Button, Modal } from '@/components/shared';
import type {
  CustomerMaintenanceEnrollmentSummary,
  CustomerRecord,
} from '@/features/customer-management/types';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import {
  customerMaintenanceEnrollmentCardSubtitle,
  customerMaintenancePlanChipVariant,
  maintenanceEnrollmentBlocksNewOwnerInvite,
} from '@/features/customer-management/utils/customerMaintenanceEnrollmentLabels';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import { EnrollMaintenanceModalBody } from '@/features/maintenance/components/EnrollMaintenanceModalBody';
import {
  ArrowLeftIcon,
  ArrowPathRoundedSquareIcon,
  CalendarDaysIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import { CheckInProTeaserModalBody } from './CheckInProTeaserModalBody';
import { CustomerMaintenanceDetailsModalBody } from './CustomerMaintenanceDetailsModalBody';
import { CustomerStatusBadge } from './CustomerStatusBadge';

const CUSTOMER_NOTE_MAX_LENGTH = 280;
const DEMO_CUSTOMER_ID_PREFIX = 'demo_';

function addOnsSummaryLine(count: number): string | null {
  if (count < 1) return null;
  return count === 1 ? '1 add-on' : `${count} add-ons`;
}

function MaintenanceEnrollmentStatusChip({
  enrollment,
}: {
  enrollment: CustomerMaintenanceEnrollmentSummary;
}) {
  const chip = customerMaintenancePlanChipVariant(enrollment);
  if (chip === 'confirmed') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        Confirmed
      </span>
    );
  }
  if (chip === 'cancelled') {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-gray-400">
        Cancelled
      </span>
    );
  }
  if (chip === 'visit_completed') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-500/35 bg-zinc-500/12 px-2 py-0.5 text-[11px] font-semibold text-zinc-200">
        <CheckCircleIcon className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
        Visit done
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200/95">
      <ClockIcon className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
      Pending
    </span>
  );
}

interface CustomerDetailPanelProps {
  customer: CustomerRecord;
  /** Pro: Check-in opens SMS with prefilled message. Free: opens upgrade teaser. */
  hasProCheckInAccess: boolean;
  onClose: () => void;
  onMessageCustomer: (_mode: 'message' | 'win_back') => void;
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
  hasProCheckInAccess,
  onClose,
  onMessageCustomer,
  onDeleteCustomer,
  onSaveNote,
  isSavingNote,
  saveNoteError,
  onDismissSaveNoteError,
  formatCurrency,
}) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [checkInTeaserOpen, setCheckInTeaserOpen] = useState(false);
  const [enrollMaintenanceOpen, setEnrollMaintenanceOpen] = useState(false);
  const [maintenanceDetailsOpen, setMaintenanceDetailsOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(customer.note);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const emailTrimmed = customer.email.trim();
  const hasEmail = emailTrimmed.length > 0;
  const phoneHref = customerPhoneHref(customer.phone);
  const displayPhone = formatCustomerPhone(customer.phone);
  const hasPhone = displayPhone.trim().length > 0;
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

  useEffect(() => {
    setCheckInTeaserOpen(false);
    setEnrollMaintenanceOpen(false);
    setMaintenanceDetailsOpen(false);
    setEmailCopied(false);
  }, [customer.id]);

  const handleCopyEmail = async () => {
    if (!hasEmail) return;
    try {
      await navigator.clipboard.writeText(emailTrimmed);
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
  const needsAttention = isCustomerNeedsAttention(customer);
  const actionLabel = 'Check-in';
  const isSampleCustomer = customer.id.startsWith(DEMO_CUSTOMER_ID_PREFIX);

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
                {(hasEmail || hasPhone) && (
                  <div className="mt-2 space-y-2">
                    {hasEmail ? (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-300">{emailTrimmed}</p>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="inline-flex items-center justify-center p-0.5 text-gray-300 hover:text-white transition-colors md:cursor-pointer"
                          aria-label="Copy customer email"
                          title="Copy email"
                        >
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        </button>
                        {emailCopied ? (
                          <span className="text-[11px] text-emerald-300">
                            Copied
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {hasPhone ? (
                      phoneHref ? (
                        <a
                          href={phoneHref}
                          className="inline-flex items-center text-xs text-gray-300 tabular-nums tracking-wide underline underline-offset-2 decoration-white/40 hover:text-white hover:decoration-white/80 transition-colors"
                        >
                          {displayPhone}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-300 tabular-nums tracking-wide">
                          {displayPhone}
                        </p>
                      )
                    ) : null}
                  </div>
                )}
              </div>
              <CustomerStatusBadge
                status={customer.status}
                needsAttention={needsAttention}
              />
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

              {!isSampleCustomer && customer.maintenanceVisitsCompleted > 0 ? (
                <>
                  <div className="my-3 border-t border-dashed border-white/[0.12]" />
                  <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span>Maintenance visits (tracked)</span>
                    <span className="tabular-nums font-medium text-gray-300">
                      {customer.maintenanceVisitsCompleted}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          {!isSampleCustomer && customer.maintenanceEnrollment ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 flex items-center gap-2">
                <RectangleStackIcon className="h-4 w-4" aria-hidden />
                Maintenance
              </h3>
              <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      Maintenance detail
                    </p>
                    <MaintenanceEnrollmentStatusChip
                      enrollment={customer.maintenanceEnrollment}
                    />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {customerMaintenanceEnrollmentCardSubtitle(
                      customer.maintenanceEnrollment
                    )}
                  </p>
                </div>
                <div className="mt-4 border-t border-dashed border-white/[0.12] pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    fullWidth
                    className="text-sm font-semibold"
                    onClick={() => setMaintenanceDetailsOpen(true)}
                  >
                    View details
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider flex items-center gap-2">
                <UserCircleIcon className="h-4 w-4" />
                Notes
              </h3>
              {!isEditingNote && !isSampleCustomer ? (
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
              {isSampleCustomer ? (
                <p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap">
                  This is a sample customer only.
                </p>
              ) : isEditingNote ? (
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
              {!isSampleCustomer ? (
                <Button
                  variant="inverse"
                  size="sm"
                  onClick={() => setEnrollMaintenanceOpen(true)}
                  disabled={maintenanceEnrollmentBlocksNewOwnerInvite(
                    customer.maintenanceEnrollment
                  )}
                  icon={
                    <ArrowPathRoundedSquareIcon className="h-4 w-4 text-sky-700" />
                  }
                  fullWidth={true}
                  className="text-sm font-semibold"
                  aria-label="Send maintenance detail invite to customer"
                  title={
                    maintenanceEnrollmentBlocksNewOwnerInvite(
                      customer.maintenanceEnrollment
                    )
                      ? 'Open invite is still pending—use View details to copy the link, or wait until they finish.'
                      : undefined
                  }
                >
                  Send maintenance invite
                </Button>
              ) : null}
              {needsAttention ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    hasProCheckInAccess
                      ? onMessageCustomer('win_back')
                      : setCheckInTeaserOpen(true)
                  }
                  icon={
                    hasProCheckInAccess ? (
                      <PaperAirplaneIcon className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <LockClosedIcon className="h-4 w-4 text-gray-400" />
                    )
                  }
                  fullWidth={true}
                  className={`text-sm font-semibold ${
                    !hasProCheckInAccess
                      ? 'border-white/15 bg-white/[0.04] hover:bg-white/[0.07]'
                      : ''
                  }`}
                  aria-label={
                    hasProCheckInAccess
                      ? `${actionLabel} customer via SMS`
                      : `${actionLabel}: Pro feature — learn more`
                  }
                  title={hasProCheckInAccess ? undefined : 'Pro feature'}
                >
                  {actionLabel}
                </Button>
              ) : null}
              {!isSampleCustomer ? (
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
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <Modal
        isOpen={checkInTeaserOpen}
        onClose={() => setCheckInTeaserOpen(false)}
        title="Check-in"
        maxWidth="sm"
      >
        <CheckInProTeaserModalBody
          onClose={() => setCheckInTeaserOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={maintenanceDetailsOpen}
        onClose={() => setMaintenanceDetailsOpen(false)}
        title="Maintenance detail"
        maxWidth="md"
      >
        {customer.maintenanceEnrollment ? (
          <CustomerMaintenanceDetailsModalBody
            enrollment={customer.maintenanceEnrollment}
            onClose={() => setMaintenanceDetailsOpen(false)}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={enrollMaintenanceOpen}
        onClose={() => setEnrollMaintenanceOpen(false)}
        title="Maintenance detail invite"
        maxWidth="2xl"
        panelClassName="sm:ring-1 sm:ring-inset sm:ring-white/10 sm:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]"
        headerClassName="lg:px-10 lg:py-6 lg:border-white/[0.08]"
        titleClassName="lg:text-xl lg:tracking-tight"
        contentClassName="lg:px-10 lg:pb-10 lg:pt-8"
      >
        <EnrollMaintenanceModalBody
          key={`${customer.id}-${enrollMaintenanceOpen}`}
          customerId={customer.id}
          customerName={customer.name}
          onClose={() => setEnrollMaintenanceOpen(false)}
        />
      </Modal>
    </>
  );
};
