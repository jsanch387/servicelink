import { Button } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import {
  customerPhoneHref,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import { buildSmsHref } from '@/features/customer-management/utils/smsLink';
import {
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface SendBookingLinkModalBodyProps {
  customer: CustomerRecord;
  templateMessage: string;
  onTemplateMessageChange: (_message: string) => void;
  onClose: () => void;
}

export const SendBookingLinkModalBody: React.FC<
  SendBookingLinkModalBodyProps
> = ({ customer, templateMessage, onTemplateMessageChange, onClose }) => {
  const phoneHref = customerPhoneHref(customer.phone);
  const displayPhone = formatCustomerPhone(customer.phone);
  const smsHref = buildSmsHref(customer.phone, templateMessage);

  const handleSendSms = () => {
    if (!smsHref) return;
    window.location.href = smsHref;
    onClose();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-gray-500">To</p>
        <p className="text-sm font-semibold text-white mt-1">{customer.name}</p>
        {phoneHref ? (
          <a
            href={phoneHref}
            className="text-xs text-gray-400 mt-1 inline-flex hover:text-white transition-colors"
          >
            {displayPhone}
          </a>
        ) : (
          <p className="text-xs text-gray-400 mt-1">{displayPhone}</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">Message</p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(templateMessage);
            }}
            className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-gray-300 hover:text-white hover:border-white/25 transition-colors"
            aria-label="Copy message"
            title="Copy message"
          >
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <textarea
          value={templateMessage}
          onChange={e => onTemplateMessageChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button
          variant="secondary"
          onClick={handleSendSms}
          disabled={!smsHref}
          icon={<PaperAirplaneIcon className="h-4 w-4 text-emerald-400" />}
          className="text-sm font-semibold"
        >
          Send SMS
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
