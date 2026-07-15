'use client';

import {
  Button,
  DropdownSelect,
  FormStepSection,
  Input,
  PhoneInput,
  SmsNotificationsConsent,
  TextArea,
} from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { API_ROUTES, getPublicBusinessProfilePath } from '@/constants/routes';
import { BookingVehicleFields } from '@/features/availability/booking/components/BookingVehicleFields';
import { isValidVehicleYearFourDigit } from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { QuoteStickyBar } from '@/features/quotes/shared/components/QuoteStickyBar';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  PublicFlowBackNavLabel,
  PublicFlowStickyBackHeader,
  publicFlowBackNavClassName,
} from '@/components/shared';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  PublicQuoteRequestFormData,
  PublicQuoteRequestFormErrors,
} from '../types';
import { PublicQuoteRequestSuccess } from './PublicQuoteRequestSuccess';

interface PublicQuoteRequestScreenProps {
  businessSlug: string;
  businessName: string;
  businessType?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
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

export const PublicQuoteRequestScreen: React.FC<
  PublicQuoteRequestScreenProps
> = ({
  businessSlug,
  businessName,
  businessType,
  bookingFlowLocale = 'en',
}) => {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const qf = ui.quoteForm;
  const cf = ui.customerForm;

  const [form, setForm] = useState<PublicQuoteRequestFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<PublicQuoteRequestFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<QuoteRequestStep>('contact');
  const [agreedToSmsNotifications, setAgreedToSmsNotifications] =
    useState(true);

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

  const timelineOptions = useMemo(
    () => [
      { value: 'ASAP', label: qf.timelineAsap },
      { value: 'This week', label: qf.timelineThisWeek },
      { value: 'Next 2 weeks', label: qf.timelineNextTwoWeeks },
      { value: 'This month', label: qf.timelineThisMonth },
      { value: 'Flexible', label: qf.timelineFlexible },
    ],
    [qf]
  );

  const isContactFieldsValid = useMemo(
    () =>
      form.customerName.trim().length > 0 &&
      isValidEmail(form.customerEmail) &&
      isValidPhoneDigits(form.customerPhone),
    [form.customerEmail, form.customerName, form.customerPhone]
  );

  const isVehicleValid = useMemo(
    () =>
      !showVehicleFields ||
      (isValidVehicleYearFourDigit(form.vehicleYear.trim()) &&
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
    if (step === 'contact') return isContactFieldsValid;
    if (step === 'vehicle') return isVehicleValid;
    return isRequestValid;
  }, [isContactFieldsValid, isRequestValid, isVehicleValid, step]);

  const canSubmit = isContactFieldsValid && isVehicleValid && isRequestValid;

  const stepIndex = steps.indexOf(step);
  const isLastStep = stepIndex === steps.length - 1;
  const profileBackHref = getPublicBusinessProfilePath(businessSlug, {
    lang: bookingFlowLocale,
  });

  const headerBackLabel = useMemo(() => {
    if (step === 'contact') return ui.nav.backToProfile;
    if (step === 'vehicle') return ui.nav.backToYourDetails;
    return showVehicleFields ? ui.nav.backToVehicle : ui.nav.backToYourDetails;
  }, [showVehicleFields, step, ui.nav]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const setField = <K extends keyof PublicQuoteRequestFormData>(
    key: K,
    value: PublicQuoteRequestFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: PublicQuoteRequestFormErrors = {};

    if (!form.customerName.trim()) next.customerName = qf.errName;
    if (!isValidEmail(form.customerEmail)) next.customerEmail = qf.errEmail;
    if (!isValidPhoneDigits(form.customerPhone))
      next.customerPhone = qf.errPhone;
    if (!form.serviceRequested.trim()) next.serviceRequested = qf.errService;
    if (showVehicleFields) {
      if (!isValidVehicleYearFourDigit(form.vehicleYear.trim()))
        next.vehicleYear = qf.errVehicleYear;
      if (!form.vehicleMake.trim()) next.vehicleMake = qf.errVehicleMake;
      if (!form.vehicleModel.trim()) next.vehicleModel = qf.errVehicleModel;
    }
    if (!form.details.trim()) next.details = qf.errDetails;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    const all: PublicQuoteRequestFormErrors = {};
    if (!form.customerName.trim()) all.customerName = qf.errName;
    if (!isValidEmail(form.customerEmail)) all.customerEmail = qf.errEmail;
    if (!isValidPhoneDigits(form.customerPhone))
      all.customerPhone = qf.errPhone;
    if (showVehicleFields) {
      if (!isValidVehicleYearFourDigit(form.vehicleYear.trim()))
        all.vehicleYear = qf.errVehicleYear;
      if (!form.vehicleMake.trim()) all.vehicleMake = qf.errVehicleMake;
      if (!form.vehicleModel.trim()) all.vehicleModel = qf.errVehicleModel;
    }
    if (!form.serviceRequested.trim()) all.serviceRequested = qf.errService;
    if (!form.details.trim()) all.details = qf.errDetails;

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

    if (isLastStep) {
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
        } | null;
        if (!res.ok || !json?.success) {
          setSubmitError(
            typeof json?.error === 'string' && json.error.trim()
              ? json.error
              : qf.submitErrorGeneric
          );
          return;
        }
        setSubmitted(true);
      } catch {
        setSubmitError(qf.submitErrorGeneric);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!canProceedCurrentStep && !validateCurrentStep()) return;
    setStep(steps[stepIndex + 1]);
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    setStep(steps[stepIndex - 1]);
  };

  const headerClassName = publicFlowBackNavClassName;

  if (submitted) {
    return (
      <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          <PublicQuoteRequestSuccess
            businessName={businessName}
            businessSlug={businessSlug}
            form={form}
            showVehicleFields={showVehicleFields}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)]">
      <PublicFlowStickyBackHeader>
        {step === 'contact' ? (
          <Link href={profileBackHref} className={headerClassName}>
            <PublicFlowBackNavLabel label={headerBackLabel} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className={headerClassName}
          >
            <PublicFlowBackNavLabel label={headerBackLabel} />
          </button>
        )}
      </PublicFlowStickyBackHeader>

      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col px-4 pb-28 pt-6 sm:px-6 sm:pb-32">
        {step === 'contact' ? (
          <div className="mb-6">
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {ui.profile.requestQuote}
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-gray-500">
              {ui.profile.quotePageSubtitle(businessName)}
            </p>
          </div>
        ) : null}

        <div className="flex-1 space-y-6">
          {step === 'contact' ? (
            <FormStepSection
              title={cf.yourDetails}
              footer={
                <SmsNotificationsConsent
                  businessName={businessName}
                  agreed={agreedToSmsNotifications}
                  onAgreedChange={setAgreedToSmsNotifications}
                  bookingFlowLocale={bookingFlowLocale}
                />
              }
            >
              <Input
                label={cf.fullName}
                value={form.customerName}
                onChange={v => setField('customerName', v)}
                placeholder="Jane Doe"
                required
                autoComplete="name"
                error={errors.customerName}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={cf.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.customerEmail}
                  onChange={v => setField('customerEmail', v)}
                  placeholder="jane@example.com"
                  required
                  error={errors.customerEmail}
                />
                <PhoneInput
                  label={cf.phone}
                  value={form.customerPhone}
                  onChange={v => setField('customerPhone', v)}
                  placeholder="(555) 123-4567"
                  required
                  error={errors.customerPhone}
                  showDigitHint
                />
              </div>
            </FormStepSection>
          ) : null}

          {step === 'vehicle' && showVehicleFields ? (
            <FormStepSection title={cf.vehicle}>
              <BookingVehicleFields
                value={{
                  vehicleYear: form.vehicleYear,
                  vehicleMake: form.vehicleMake,
                  vehicleModel: form.vehicleModel,
                }}
                onChange={updates => setForm(prev => ({ ...prev, ...updates }))}
                errors={{
                  vehicleYear: errors.vehicleYear,
                  vehicleMake: errors.vehicleMake,
                  vehicleModel: errors.vehicleModel,
                }}
                bookingFlowLocale={bookingFlowLocale}
              />
            </FormStepSection>
          ) : null}

          {step === 'request' ? (
            <div className="space-y-6">
              {submitError ? (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              ) : null}
              <FormStepSection title={qf.quoteDetails}>
                <Input
                  label={qf.serviceRequested}
                  value={form.serviceRequested}
                  onChange={v => setField('serviceRequested', v)}
                  placeholder={qf.serviceRequestedPlaceholder}
                  required
                  error={errors.serviceRequested}
                />
                <DropdownSelect
                  label={qf.whenOptional}
                  value={form.timeline}
                  onChange={v => setField('timeline', v)}
                  options={timelineOptions}
                  placeholder={qf.whenPlaceholder}
                />
              </FormStepSection>
              <TextArea
                label={qf.detailsLabel}
                value={form.details}
                onChange={v => setField('details', v)}
                placeholder={qf.detailsPlaceholder}
                rows={4}
                required
                maxLength={700}
                hideCharCount
                inputClassName="!rounded-[10px]"
                error={errors.details}
              />
            </div>
          ) : null}
        </div>
      </div>

      <QuoteStickyBar containerClassName="max-w-2xl">
        <Button
          type="button"
          variant="inverse"
          fullWidth
          className="font-semibold"
          disabled={
            isLastStep ? !canSubmit || isSubmitting : !canProceedCurrentStep
          }
          loading={isLastStep && isSubmitting}
          onClick={() => void handlePrimaryAction()}
        >
          {isLastStep ? qf.submitRequest : ui.common.continue}
        </Button>
      </QuoteStickyBar>
    </main>
  );
};

export default PublicQuoteRequestScreen;
