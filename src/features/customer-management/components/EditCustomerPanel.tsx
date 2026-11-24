'use client';

import { Button, Input, PhoneInput, TextArea } from '@/components/shared';
import {
  updateCustomerProfile,
  type SavedCustomerProfile,
} from '@/features/customer-management/api/updateCustomerContact';
import type { CustomerRecord } from '@/features/customer-management/types';
import { parseCustomerProfileFields } from '@/features/customer-management/utils/parseCustomerContactFields';
import { CUSTOMER_NOTE_MAX_LENGTH } from '@/features/customer-management/utils/parseCreateCustomerBody';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const DEMO_CUSTOMER_ID_PREFIX = 'demo_';

interface EditCustomerPanelProps {
  customer: CustomerRecord;
  onClose: () => void;
  onSaved: (profile: SavedCustomerProfile) => void;
}

export const EditCustomerPanel: React.FC<EditCustomerPanelProps> = ({
  customer,
  onClose,
  onSaved,
}) => {
  const address = customer.address;
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(() =>
    normalizeUsPhoneDigits(customer.phone)
  );
  const [email, setEmail] = useState(customer.email);
  const [street, setStreet] = useState(address?.street ?? '');
  const [unit, setUnit] = useState(address?.unit ?? '');
  const [city, setCity] = useState(address?.city ?? '');
  const [state, setState] = useState(address?.state ?? '');
  const [zip, setZip] = useState(address?.zip ?? '');
  const [note, setNote] = useState(customer.note);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!saving) onClose();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const save = async () => {
    if (saving) return;
    if (customer.id.startsWith(DEMO_CUSTOMER_ID_PREFIX)) {
      setError('This sample customer can’t be edited.');
      return;
    }
    const parsed = parseCustomerProfileFields({
      name,
      phone,
      email,
      street,
      unit,
      city,
      state,
      zip,
      note,
    });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateCustomerProfile(customer.id, {
      name,
      phone,
      email,
      street,
      unit,
      city,
      state,
      zip,
      note,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.profile);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-pointer bg-black/30 md:bg-black/40 md:backdrop-blur-sm"
        aria-label="Close edit customer"
        onClick={close}
      />
      <div
        className="fixed inset-0 z-50 flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] animate-in slide-in-from-right duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-lg md:border-l md:border-white/5 md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 p-4">
          <h2
            id="edit-customer-title"
            className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-white"
          >
            Edit customer
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-white/60 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={event => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-28 scrollbar-hide sm:p-5 sm:pb-28">
            {error ? (
              <p className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            <div className="divide-y divide-white/[0.08]">
              <div className="space-y-3 pb-6">
                <Input
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="Customer name"
                  autoComplete="name"
                  disabled={saving}
                />
                <PhoneInput
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  disabled={saving}
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="name@email.com"
                  autoComplete="email"
                  disabled={saving}
                />
              </div>

              <div className="space-y-3 py-6">
                <h3 className="text-sm font-semibold text-white">Address</h3>
                <Input
                  label="Street"
                  value={street}
                  onChange={setStreet}
                  placeholder="123 Main St"
                  autoComplete="street-address"
                  disabled={saving}
                />
                <Input
                  label="Unit"
                  value={unit}
                  onChange={setUnit}
                  placeholder="Apt 2"
                  autoComplete="address-line2"
                  maxLength={50}
                  disabled={saving}
                />
                <Input
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="Austin"
                  autoComplete="address-level2"
                  disabled={saving}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="State"
                    value={state}
                    onChange={value => setState(value.toUpperCase())}
                    placeholder="TX"
                    autoComplete="address-level1"
                    maxLength={2}
                    disabled={saving}
                  />
                  <Input
                    label="ZIP"
                    value={zip}
                    onChange={setZip}
                    placeholder="78701"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <TextArea
                  label="Notes"
                  value={note}
                  onChange={setNote}
                  placeholder="Anything helpful for future visits"
                  rows={4}
                  maxLength={CUSTOMER_NOTE_MAX_LENGTH}
                  disabled={saving}
                />

                <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={close}
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="inverse"
                    loading={saving}
                    className="w-full sm:w-auto"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
