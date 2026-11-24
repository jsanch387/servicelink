'use client';

import { Button, Input, PhoneInput } from '@/components/shared';
import {
  updateCustomerAddress,
  updateCustomerEmail,
  updateCustomerPhone,
} from '@/features/customer-management/api/updateCustomerContact';
import type { CustomerAddress } from '@/features/customer-management/types';
import {
  parseCustomerAddressFields,
  parseCustomerEmailField,
  parseCustomerPhoneField,
} from '@/features/customer-management/utils/parseCustomerContactFields';
import React, { useState } from 'react';

export type ContactSheetKind = 'phone' | 'email' | 'address';

interface AddCustomerContactModalBodyProps {
  customerId: string;
  kind: ContactSheetKind;
  onClose: () => void;
  onSaved: (patch: {
    phone?: string;
    email?: string;
    address?: CustomerAddress;
  }) => void;
}

const buttonRowClass = 'mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end';

export const AddCustomerContactModalBody: React.FC<
  AddCustomerContactModalBodyProps
> = ({ customerId, kind, onClose, onSaved }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (kind === 'phone') {
      const parsed = parseCustomerPhoneField(phone);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setSaving(true);
      const result = await updateCustomerPhone(customerId, parsed.phone);
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved({ phone: result.phone });
      onClose();
      return;
    }

    if (kind === 'email') {
      const parsed = parseCustomerEmailField(email);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setSaving(true);
      const result = await updateCustomerEmail(customerId, parsed.email);
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved({ email: result.email });
      onClose();
      return;
    }

    const parsed = parseCustomerAddressFields({
      street,
      unit,
      city,
      state,
      zip,
    });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    const result = await updateCustomerAddress(customerId, parsed.address);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved({ address: result.address });
    onClose();
  };

  return (
    <form
      onSubmit={event => void handleSubmit(event)}
      className="flex min-h-full flex-1 flex-col"
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {kind === 'phone' ? (
          <PhoneInput
            label="Phone"
            value={phone}
            onChange={setPhone}
            required
            disabled={saving}
          />
        ) : null}
        {kind === 'email' ? (
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@email.com"
            required
            disabled={saving}
            autoComplete="email"
          />
        ) : null}
        {kind === 'address' ? (
          <>
            <Input
              label="Street"
              value={street}
              onChange={setStreet}
              placeholder="123 Main St"
              required
              disabled={saving}
              autoComplete="street-address"
            />
            <Input
              label="Unit"
              value={unit}
              onChange={setUnit}
              placeholder="Apt 2"
              disabled={saving}
              autoComplete="address-line2"
              maxLength={50}
            />
            <Input
              label="City"
              value={city}
              onChange={setCity}
              placeholder="Austin"
              required
              disabled={saving}
              autoComplete="address-level2"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="State"
                value={state}
                onChange={value => setState(value.toUpperCase())}
                placeholder="TX"
                required
                disabled={saving}
                autoComplete="address-level1"
                maxLength={2}
              />
              <Input
                label="ZIP"
                value={zip}
                onChange={setZip}
                placeholder="78701"
                inputMode="numeric"
                required
                disabled={saving}
                autoComplete="postal-code"
                maxLength={5}
              />
            </div>
          </>
        ) : null}
      </div>
      <div className={buttonRowClass}>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
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
          {kind === 'phone'
            ? 'Add phone'
            : kind === 'email'
              ? 'Add email'
              : 'Add address'}
        </Button>
      </div>
    </form>
  );
};
