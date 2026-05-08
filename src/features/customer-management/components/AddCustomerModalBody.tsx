import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import type { AddCustomerDraft } from '@/features/customer-management/types';
import {
  CUSTOMER_NOTE_MAX_LENGTH,
  parseCreateCustomerBody,
} from '@/features/customer-management/utils/parseCreateCustomerBody';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';

interface AddCustomerModalBodyProps {
  onClose: () => void;
  onBusyChange?: (_busy: boolean) => void;
  createCustomer: (
    _draft: AddCustomerDraft
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const INITIAL_DRAFT: AddCustomerDraft = {
  name: '',
  email: '',
  phone: '',
  notes: '',
};

export const AddCustomerModalBody: React.FC<AddCustomerModalBodyProps> = ({
  onClose,
  onBusyChange,
  createCustomer,
}) => {
  const [draft, setDraft] = useState<AddCustomerDraft>(INITIAL_DRAFT);
  const [phase, setPhase] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    onBusyChange?.(isSubmitting);
  }, [isSubmitting, onBusyChange]);

  useEffect(() => {
    return () => {
      onBusyChange?.(false);
    };
  }, [onBusyChange]);

  const canSubmit = draft.name.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseCreateCustomerBody({
      fullName: draft.name,
      email: draft.email,
      phone: draft.phone,
      notes: draft.notes,
    });
    if (!parsed.ok) {
      setFormError(parsed.error);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const result = await createCustomer({
      name: parsed.fullName,
      email: draft.email.trim(),
      phone: draft.phone,
      notes: draft.notes,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setPhase('success');
  };

  if (phase === 'success') {
    return (
      <div className="space-y-5 pt-1">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircleIcon className="h-7 w-7 text-emerald-400" aria-hidden />
          </div>
          <p className="text-base font-semibold text-white">Customer added.</p>
        </div>
        <div className="w-full">
          <Button
            type="button"
            variant="inverse"
            fullWidth
            className="font-semibold"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="space-y-3">
      {formError ? (
        <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {formError}
        </p>
      ) : null}

      <Input
        label="Name"
        value={draft.name}
        onChange={value => setDraft(prev => ({ ...prev, name: value }))}
        placeholder="Customer name"
        required
        disabled={isSubmitting}
        autoComplete="name"
      />

      <div className="space-y-1.5">
        <Input
          label="Email (optional)"
          type="email"
          value={draft.email}
          onChange={value => setDraft(prev => ({ ...prev, email: value }))}
          placeholder="customer@email.com"
          disabled={isSubmitting}
          autoComplete="email"
        />
        {!draft.email.trim() ? (
          <p className="text-xs text-gray-500 leading-relaxed">
            Email is optional. This customer won&apos;t receive email
            confirmations until you add one.
          </p>
        ) : null}
      </div>

      <PhoneInput
        label="Phone (optional)"
        value={draft.phone}
        onChange={value => setDraft(prev => ({ ...prev, phone: value }))}
        showDigitHint
        disabled={isSubmitting}
      />

      <TextArea
        label="Notes (optional)"
        value={draft.notes}
        onChange={value => setDraft(prev => ({ ...prev, notes: value }))}
        placeholder="Anything helpful for future visits…"
        rows={3}
        maxLength={CUSTOMER_NOTE_MAX_LENGTH}
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="inverse"
          disabled={!canSubmit}
          loading={isSubmitting}
        >
          Add customer
        </Button>
      </div>
    </form>
  );
};
