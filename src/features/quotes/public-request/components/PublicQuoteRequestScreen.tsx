'use client';

import {
  Button,
  GlassCard,
  Input,
  PhoneInput,
  Select,
  TextArea,
} from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { QuoteStickyBar } from '@/features/quotes/shared/components/QuoteStickyBar';
import React, { useMemo, useState } from 'react';
import type {
  PublicQuoteRequestFormData,
  PublicQuoteRequestFormErrors,
} from '../types';
import { PublicQuoteRequestSuccess } from './PublicQuoteRequestSuccess';

interface PublicQuoteRequestScreenProps {
  businessSlug: string;
  businessName: string;
  businessType?: string | null;
}

type QuoteRequestStep = 'contact' | 'vehicle' | 'request';

const INITIAL_FORM: PublicQuoteRequestFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  serviceRequested: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  timeline: '',
  details: '',
};

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}

function isValidPhoneDigits(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

function isValidVehicleYear(value: string): boolean {
  return /^(19|20)\d{2}$/.test(value.trim());
}

export const PublicQuoteRequestScreen: React.FC<
  PublicQuoteRequestScreenProps
> = ({ businessSlug, businessName, businessType }) => {
  const [form, setForm] = useState<PublicQuoteRequestFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<PublicQuoteRequestFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [step, setStep] = useState<QuoteRequestStep>('contact');

  const showVehicleFields = useMemo(() => {
    const t = (businessType ?? '').trim().toLowerCase();
    if (!t) return false;
    return t.includes('auto') || t.includes('detail');
  }, [businessType]);

  const steps = useMemo(
    () =>
      showVehicleFields
        ? (['contact', 'vehicle', 'request'] as QuoteRequestStep[])
        : (['contact', 'request'] as QuoteRequestStep[]),
    [showVehicleFields]
  );

  const isContactValid = useMemo(
    () =>
      form.customerName.trim().length > 0 &&
      isValidEmail(form.customerEmail) &&
      isValidPhoneDigits(form.customerPhone),
    [form.customerEmail, form.customerName, form.customerPhone]
  );
  const isVehicleValid = useMemo(
    () =>
      !showVehicleFields ||
      (isValidVehicleYear(form.vehicleYear) &&
        form.vehicleMake.trim().length > 0 &&
        form.vehicleModel.trim().length > 0),
    [form.vehicleMake, form.vehicleModel, form.vehicleYear, showVehicleFields]
  );
  const isRequestValid = useMemo(
    () =>
      form.serviceRequested.trim().length > 0 && form.details.trim().length > 0,
    [form.serviceRequested, form.details]
  );

  const canProceedCurrentStep = useMemo(() => {
    if (step === 'contact') return isContactValid;
    if (step === 'vehicle') return isVehicleValid;
    return isRequestValid;
  }, [isContactValid, isRequestValid, isVehicleValid, step]);

  const canSubmit = isContactValid && isVehicleValid && isRequestValid;

  const setField = <K extends keyof PublicQuoteRequestFormData>(
    key: K,
    value: PublicQuoteRequestFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: PublicQuoteRequestFormErrors = {};

    if (!form.customerName.trim()) next.customerName = 'Name is required';
    if (!isValidEmail(form.customerEmail))
      next.customerEmail = 'Enter a valid email';
    if (!isValidPhoneDigits(form.customerPhone))
      next.customerPhone = 'Phone must be 10 digits';
    if (!form.serviceRequested.trim())
      next.serviceRequested = 'Service is required';
    if (showVehicleFields) {
      if (!isValidVehicleYear(form.vehicleYear))
        next.vehicleYear = 'Enter a valid 4-digit year';
      if (!form.vehicleMake.trim())
        next.vehicleMake = 'Vehicle make is required';
      if (!form.vehicleModel.trim())
        next.vehicleModel = 'Vehicle model is required';
    }
    if (!form.details.trim()) next.details = 'Please add project details';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    const all: PublicQuoteRequestFormErrors = {};
    if (!form.customerName.trim()) all.customerName = 'Name is required';
    if (!isValidEmail(form.customerEmail))
      all.customerEmail = 'Enter a valid email';
    if (!isValidPhoneDigits(form.customerPhone))
      all.customerPhone = 'Phone must be 10 digits';
    if (showVehicleFields) {
      if (!isValidVehicleYear(form.vehicleYear))
        all.vehicleYear = 'Enter a valid 4-digit year';
      if (!form.vehicleMake.trim())
        all.vehicleMake = 'Vehicle make is required';
      if (!form.vehicleModel.trim())
        all.vehicleModel = 'Vehicle model is required';
    }
    if (!form.serviceRequested.trim())
      all.serviceRequested = 'Service is required';
    if (!form.details.trim()) all.details = 'Please add project details';

    const filtered: PublicQuoteRequestFormErrors =
      step === 'contact'
        ? {
            customerName: all.customerName,
            customerEmail: all.customerEmail,
            customerPhone: all.customerPhone,
          }
        : step === 'vehicle'
          ? {
              vehicleYear: all.vehicleYear,
              vehicleMake: all.vehicleMake,
              vehicleModel: all.vehicleModel,
            }
          : {
              serviceRequested: all.serviceRequested,
              details: all.details,
            };
    setErrors(prev => ({ ...prev, ...filtered }));
    return !Object.values(filtered).some(Boolean);
  };

  const handlePrimaryAction = async () => {
    setSubmitError(null);
    const idx = steps.indexOf(step);
    const isLast = idx === steps.length - 1;
    if (isLast) {
      if (!validate()) return;
      setIsSubmitting(true);
      try {
        const res = await fetch(API_ROUTES.PUBLIC_QUOTE_REQUEST, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSlug,
            customerName: form.customerName,
            customerEmail: form.customerEmail,
            customerPhone: form.customerPhone,
            serviceRequested: form.serviceRequested,
            vehicleYear: showVehicleFields ? form.vehicleYear : '',
            vehicleMake: showVehicleFields ? form.vehicleMake : '',
            vehicleModel: showVehicleFields ? form.vehicleModel : '',
            timeline: form.timeline,
            details: form.details,
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          error?: string;
          data?: { quoteId?: string };
        } | null;
        const quoteId =
          typeof json?.data?.quoteId === 'string'
            ? json.data.quoteId.trim()
            : '';
        if (!res.ok || !json?.success || !quoteId) {
          setSubmitError(
            typeof json?.error === 'string' && json.error.trim()
              ? json.error
              : 'Something went wrong. Please try again.'
          );
          return;
        }
        setSavedQuoteId(quoteId);
        setSubmitted(true);
      } catch {
        setSubmitError('Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (!canProceedCurrentStep && !validateCurrentStep()) return;
    setStep(steps[idx + 1]);
  };

  const handleBack = () => {
    const idx = steps.indexOf(step);
    if (idx <= 0) return;
    setStep(steps[idx - 1]);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          <PublicQuoteRequestSuccess
            businessName={businessName}
            businessSlug={businessSlug}
            form={form}
            showVehicleFields={showVehicleFields}
            quoteId={savedQuoteId}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <QuoteFlowHeader
          backHref={`/${businessSlug}`}
          backLabel="Back to profile"
          title="Request Quote"
          subtitle={`Share a few details and ${businessName} will send back a quote.`}
        />

        <GlassCard
          padding="md"
          rounded="rounded-2xl"
          blurColor="bg-zinc-500"
          showBlur={true}
          className="mt-6 w-full max-w-xl"
        >
          <div className="space-y-4">
            {step === 'contact' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Your information
                </p>
                <Input
                  label="Name"
                  value={form.customerName}
                  onChange={v => setField('customerName', v)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  error={errors.customerName}
                />
                <Input
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.customerEmail}
                  onChange={v => setField('customerEmail', v)}
                  placeholder="you@email.com"
                  required
                  error={errors.customerEmail}
                />
                <PhoneInput
                  label="Phone"
                  value={form.customerPhone}
                  onChange={v => setField('customerPhone', v)}
                  placeholder="(555) 123-4567"
                  required
                  error={errors.customerPhone}
                  showDigitHint={false}
                />
              </>
            ) : null}

            {step === 'vehicle' && showVehicleFields ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Vehicle
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Vehicle year"
                    value={form.vehicleYear}
                    onChange={v => setField('vehicleYear', v)}
                    placeholder="e.g. 2020"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    error={errors.vehicleYear}
                  />
                  <Input
                    label="Vehicle make"
                    value={form.vehicleMake}
                    onChange={v => setField('vehicleMake', v)}
                    placeholder="e.g. Toyota"
                    required
                    error={errors.vehicleMake}
                  />
                  <Input
                    label="Vehicle model"
                    value={form.vehicleModel}
                    onChange={v => setField('vehicleModel', v)}
                    placeholder="e.g. Camry"
                    required
                    error={errors.vehicleModel}
                  />
                </div>
              </>
            ) : null}

            {step === 'request' ? (
              <>
                {submitError ? (
                  <p className="text-sm text-red-400" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Quote details
                </p>
                <Input
                  label="Service requested"
                  value={form.serviceRequested}
                  onChange={v => setField('serviceRequested', v)}
                  placeholder='e.g. "Interior + exterior detail"'
                  required
                  error={errors.serviceRequested}
                />
                <Select
                  label="When? (optional)"
                  value={form.timeline}
                  onChange={v => setField('timeline', v)}
                  options={[
                    { value: 'ASAP', label: 'ASAP' },
                    { value: 'This week', label: 'This week' },
                    { value: 'Next 2 weeks', label: 'Next 2 weeks' },
                    { value: 'This month', label: 'This month' },
                    { value: 'Flexible', label: 'Flexible' },
                  ]}
                  placeholder="Select timeline"
                />
                <TextArea
                  label="What do you need done?"
                  value={form.details}
                  onChange={v => setField('details', v)}
                  placeholder="Share a few details so we can quote accurately."
                  rows={4}
                  required
                  maxLength={700}
                />
                {errors.details ? (
                  <p className="-mt-2 text-sm text-red-400">{errors.details}</p>
                ) : null}
              </>
            ) : null}
          </div>
        </GlassCard>
      </div>

      <QuoteStickyBar>
        {steps.indexOf(step) > 0 ? (
          <div className="flex items-stretch gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 px-5"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="inverse"
              size="sm"
              className="min-w-0 flex-1 font-semibold"
              disabled={
                steps.indexOf(step) === steps.length - 1
                  ? !canSubmit || isSubmitting
                  : !canProceedCurrentStep
              }
              loading={steps.indexOf(step) === steps.length - 1 && isSubmitting}
              onClick={() => void handlePrimaryAction()}
            >
              {steps.indexOf(step) === steps.length - 1
                ? 'Submit request'
                : 'Continue'}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="inverse"
            fullWidth
            className="font-semibold"
            disabled={!canProceedCurrentStep}
            onClick={handlePrimaryAction}
          >
            Continue
          </Button>
        )}
      </QuoteStickyBar>
    </main>
  );
};

export default PublicQuoteRequestScreen;
