'use client';

import { Button } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { CustomerMaintenanceEnrollmentSummary } from '@/features/customer-management/types';
import {
  customerMaintenanceAnchorDisplay,
  customerMaintenanceEnrollmentCardSubtitle,
} from '@/features/customer-management/utils/customerMaintenanceEnrollmentLabels';
import { maintenanceEnrollmentPaidWithCard } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import { buildMaintenanceInviteCustomerUrl } from '@/features/maintenance/utils/buildMaintenanceInviteCustomerUrl';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function formatPriceWhole(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function frequencyLabel(weeks: number): string {
  if (weeks <= 1) return 'Every week';
  return `Every ${weeks} weeks`;
}

function paymentLine(e: CustomerMaintenanceEnrollmentSummary): string {
  if (
    e.status === 'enrolled_pending_customer' &&
    e.paymentStatus === 'pending'
  ) {
    return '—';
  }
  if (maintenanceEnrollmentPaidWithCard(e.paymentStatus))
    return 'Paid online (card)';
  if (e.paymentStatus === 'pay_in_person') return 'Pay in person';
  return e.paymentStatus.replace(/_/g, ' ') || '—';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-white sm:text-right">{value}</p>
    </div>
  );
}

interface CustomerMaintenanceDetailsModalBodyProps {
  enrollment: CustomerMaintenanceEnrollmentSummary;
  onClose: () => void;
}

export function CustomerMaintenanceDetailsModalBody({
  enrollment,
  onClose,
}: CustomerMaintenanceDetailsModalBodyProps) {
  const statusLine = customerMaintenanceEnrollmentCardSubtitle(enrollment);
  const inviteUrl = enrollment.inviteToken
    ? buildMaintenanceInviteCustomerUrl(enrollment.inviteToken)
    : '';
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        Copy the link to text or email—especially if they have no inbox on file.
      </p>

      {inviteUrl ? (
        <Button
          type="button"
          variant="inverse"
          size="sm"
          fullWidth
          className="text-sm font-semibold"
          onClick={() => void handleCopyInviteLink()}
          icon={
            linkCopied ? (
              <CheckIcon className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <ClipboardDocumentIcon
                className="h-4 w-4 text-neutral-700"
                aria-hidden
              />
            )
          }
        >
          {linkCopied ? 'Copied' : 'Copy invite link'}
        </Button>
      ) : (
        <p className="text-xs text-gray-500">
          No link on file for this enrollment (older invites). You can send a
          new invite from the customer panel when this invite is no longer
          pending.
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
        <DetailRow label="Status" value={statusLine} />
        <div className="h-px bg-white/[0.06]" />
        <DetailRow label="Service" value={enrollment.serviceNameSnapshot} />
        <DetailRow
          label="Price per visit"
          value={formatPriceWhole(enrollment.priceCents)}
        />
        <DetailRow
          label="Frequency"
          value={frequencyLabel(enrollment.frequencyWeeks)}
        />
        <DetailRow
          label="Visit length"
          value={formatDurationMinutes(enrollment.durationMinutes)}
        />
        <DetailRow
          label="Maintenance date"
          value={customerMaintenanceAnchorDisplay(enrollment)}
        />
        <DetailRow label="Payment" value={paymentLine(enrollment)} />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        onClick={onClose}
        className="!border-white/15 !bg-zinc-950 !text-white hover:!bg-black hover:!border-white/25"
      >
        Close
      </Button>
    </div>
  );
}
