'use client';

import {
  Button,
  DropdownSelect,
  FormStepSection,
  IconButton,
  Input,
  PhoneInput,
  SmsNotificationsConsent,
  TextArea,
  useScrollWindowToTopOnChange,
} from '@/components/shared';
import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
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
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import type {
  PublicQuoteRequestFormData,
  PublicQuoteRequestFormErrors,
} from '../types';
import { PublicQuoteRequestSuccess } from './PublicQuoteRequestSuccess';
import { PublicQuoteRequestSummaryCard } from './PublicQuoteRequestSummaryCard';

interface PublicQuoteRequestScreenProps {
  businessSlug: string;
  businessName: string;
  businessType?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

type QuoteRequestStep = 'contact' | 'vehicle' | 'request' | 'review';

const INITIAL_FORM: PublicQuoteRequestFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicle2Year: '',
  vehicle2Make: '',
  vehicle2Model: '',
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

function isCompleteVehicle(year: string, make: string, model: string): boolean {
  return (
    isValidVehicleYearFourDigit(year.trim()) &&
    make.trim().length > 0 &&
    model.trim().length > 0
  );
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
  const [hasSecondVehicle, setHasSecondVehicle] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [agreedToSmsNotifications, setAgreedToSmsNotifications] =
    useState(true);

  const showVehicleFields = isVehicleRelatedBusinessType(businessType);

  const steps = useMemo(
    () =>
      showVehicleFields
        ? (['contact', 'vehicle', 'request', 'review'] as QuoteRequestStep[])
        : (['contact', 'request', 'review'] as QuoteRequestStep[]),
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

  const isVehicleValid = useMemo(() => {
    if (!showVehicleFields) return true;
    if (
      !isCompleteVehicle(form.vehicleYear, form.vehicleMake, form.vehicleModel)
    ) {
      return false;
    }
    if (!hasSecondVehicle) return true;
    return isCompleteVehicle(
      form.vehicle2Year,
      form.vehicle2Make,
      form.vehicle2Model
    );
  }, [
    form.vehicle2Make,
    form.vehicle2Model,
    form.vehicle2Year,
    form.vehicleMake,
    form.vehicleModel,
    form.vehicleYear,
    hasSecondVehicle,
    showVehicleFields,
  ]);

  const isRequestValid = form.details.trim().length > 0;
  const canSubmit = isContactFieldsValid && isVehicleValid && isRequestValid;

  const canProceedCurrentStep = useMemo(() => {
    if (step === 'contact') return isContactFieldsValid;
    if (step === 'vehicle') return isVehicleValid;
    if (step === 'request') return isRequestValid;
    return canSubmit;
  }, [canSubmit, isContactFieldsValid, isRequestValid, isVehicleValid, step]);

  const stepIndex = steps.indexOf(step);
  const isLastStep = stepIndex === steps.length - 1;
  const profileBackHref = getPublicBusinessProfilePath(businessSlug, {
    lang: bookingFlowLocale,
  });

  const headerBackLabel = useMemo(() => {
    if (returnToReview && step !== 'review') return ui.nav.backToReview;
    if (step === 'contact') return ui.nav.backToProfile;
    if (step === 'vehicle') return ui.nav.backToYourDetails;
    if (step === 'review') return qf.backToRequest;
    return showVehicleFields ? ui.nav.backToVehicle : ui.nav.backToYourDetails;
  }, [qf.backToRequest, returnToReview, showVehicleFields, step, ui.nav]);

  useScrollWindowToTopOnChange([step]);

  const setField = <K extends keyof PublicQuoteRequestFormData>(
    key: K,
    value: PublicQuoteRequestFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const applyVehicleErrors = (
    target: PublicQuoteRequestFormErrors,
    prefix: '' | '2'
  ) => {
    const yearKey = prefix === '2' ? 'vehicle2Year' : 'vehicleYear';
    const makeKey = prefix === '2' ? 'vehicle2Make' : 'vehicleMake';
    const modelKey = prefix === '2' ? 'vehicle2Model' : 'vehicleModel';
    const year = prefix === '2' ? form.vehicle2Year : form.vehicleYear;
    const make = prefix === '2' ? form.vehicle2Make : form.vehicleMake;
    const model = prefix === '2' ? form.vehicle2Model : form.vehicleModel;
    if (!isValidVehicleYearFourDigit(year.trim())) {
      target[yearKey] = qf.errVehicleYear;
    }
    if (!make.trim()) target[makeKey] = qf.errVehicleMake;
    if (!model.trim()) target[modelKey] = qf.errVehicleModel;
  };

  const validate = (): boolean => {
    const next: PublicQuoteRequestFormErrors = {};

    if (!form.customerName.trim()) next.customerName = qf.errName;
    if (!isValidEmail(form.customerEmail)) next.customerEmail = qf.errEmail;
    if (!isValidPhoneDigits(form.customerPhone))
      next.customerPhone = qf.errPhone;
    if (showVehicleFields) {
      applyVehicleErrors(next, '');
      if (hasSecondVehicle) applyVehicleErrors(next, '2');
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
      applyVehicleErrors(all, '');
      if (hasSecondVehicle) applyVehicleErrors(all, '2');
    }
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
              vehicle2Year: all.vehicle2Year,
              vehicle2Make: all.vehicle2Make,
              vehicle2Model: all.vehicle2Model,
            }
          : step === 'request'
            ? {
                details: all.details,
              }
            : all;
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
            vehicleYear: showVehicleFields ? form.vehicleYear : '',
            vehicleMake: showVehicleFields ? form.vehicleMake : '',
            vehicleModel: showVehicleFields ? form.vehicleModel : '',
            vehicle2Year:
              showVehicleFields && hasSecondVehicle ? form.vehicle2Year : '',
            vehicle2Make:
              showVehicleFields && hasSecondVehicle ? form.vehicle2Make : '',
            vehicle2Model:
              showVehicleFields && hasSecondVehicle ? form.vehicle2Model : '',
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
    if (returnToReview) {
      setReturnToReview(false);
      setStep('review');
      return;
    }
    setStep(steps[stepIndex + 1]);
  };

  const goToStepFromReview = (next: QuoteRequestStep) => {
    setReturnToReview(true);
    setStep(next);
  };

  const handleBack = () => {
    if (returnToReview && step !== 'review') {
      setReturnToReview(false);
      setStep('review');
      return;
    }
    if (stepIndex <= 0) return;
    setStep(steps[stepIndex - 1]);
  };

  const handleRemoveSecondVehicle = () => {
    setHasSecondVehicle(false);
    setForm(prev => ({
      ...prev,
      vehicle2Year: '',
      vehicle2Make: '',
      vehicle2Model: '',
    }));
    setErrors(prev => ({
      ...prev,
      vehicle2Year: undefined,
      vehicle2Make: undefined,
      vehicle2Model: undefined,
    }));
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
            showSecondVehicle={hasSecondVehicle}
            bookingFlowLocale={bookingFlowLocale}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)]">
      <PublicFlowStickyBackHeader>
        {step === 'contact' && !returnToReview ? (
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
            <div className="space-y-6">
              <FormStepSection title={cf.vehicle}>
                <BookingVehicleFields
                  value={{
                    vehicleYear: form.vehicleYear,
                    vehicleMake: form.vehicleMake,
                    vehicleModel: form.vehicleModel,
                  }}
                  onChange={updates =>
                    setForm(prev => ({ ...prev, ...updates }))
                  }
                  errors={{
                    vehicleYear: errors.vehicleYear,
                    vehicleMake: errors.vehicleMake,
                    vehicleModel: errors.vehicleModel,
                  }}
                  bookingFlowLocale={bookingFlowLocale}
                />
              </FormStepSection>
              {hasSecondVehicle ? (
                <FormStepSection
                  title={qf.secondVehicle}
                  action={
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<XMarkIcon />}
                      onClick={handleRemoveSecondVehicle}
                      aria-label={qf.removeVehicle}
                      title={qf.removeVehicle}
                    />
                  }
                >
                  <BookingVehicleFields
                    value={{
                      vehicleYear: form.vehicle2Year,
                      vehicleMake: form.vehicle2Make,
                      vehicleModel: form.vehicle2Model,
                    }}
                    onChange={updates =>
                      setForm(prev => ({
                        ...prev,
                        vehicle2Year: updates.vehicleYear ?? prev.vehicle2Year,
                        vehicle2Make: updates.vehicleMake ?? prev.vehicle2Make,
                        vehicle2Model:
                          updates.vehicleModel ?? prev.vehicle2Model,
                      }))
                    }
                    errors={{
                      vehicleYear: errors.vehicle2Year,
                      vehicleMake: errors.vehicle2Make,
                      vehicleModel: errors.vehicle2Model,
                    }}
                    bookingFlowLocale={bookingFlowLocale}
                  />
                </FormStepSection>
              ) : (
                <button
                  type="button"
                  onClick={() => setHasSecondVehicle(true)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.06]"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" aria-hidden />
                  {qf.addAnotherVehicle}
                </button>
              )}
            </div>
          ) : null}

          {step === 'request' ? (
            <FormStepSection title={qf.quoteDetails}>
              <TextArea
                label={qf.detailsLabel}
                value={form.details}
                onChange={v => setField('details', v)}
                placeholder={qf.detailsPlaceholder}
                rows={5}
                required
                maxLength={700}
                hideCharCount
                inputClassName="!rounded-[10px]"
                error={errors.details}
              />
              <DropdownSelect
                label={qf.whenOptional}
                value={form.timeline}
                onChange={v => setField('timeline', v)}
                options={timelineOptions}
                placeholder={qf.whenPlaceholder}
              />
            </FormStepSection>
          ) : null}

          {step === 'review' ? (
            <div className="space-y-6">
              {submitError ? (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              ) : null}
              <div>
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  {qf.reviewTitle}
                </h2>
                <p className="mt-0.5 max-w-xl text-sm text-gray-500">
                  {qf.reviewSubtitle}
                </p>
              </div>
              <PublicQuoteRequestSummaryCard
                form={form}
                showVehicleFields={showVehicleFields}
                showSecondVehicle={hasSecondVehicle}
                bookingFlowLocale={bookingFlowLocale}
                edits={{
                  onEditContact: () => goToStepFromReview('contact'),
                  onEditVehicle: showVehicleFields
                    ? () => goToStepFromReview('vehicle')
                    : undefined,
                  onEditRequest: () => goToStepFromReview('request'),
                }}
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
          {isLastStep
            ? qf.submitRequest
            : returnToReview
              ? ui.nav.backToReview
              : step === 'request'
                ? qf.reviewRequest
                : ui.common.continue}
        </Button>
      </QuoteStickyBar>
    </main>
  );
};

export default PublicQuoteRequestScreen;
