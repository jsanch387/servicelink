'use client';

import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';
import {
  DEFAULT_SCHEDULE,
  type WeeklySchedule,
} from '@/features/availability/types/availability';
import React, { useCallback, useEffect, useState } from 'react';
import type {
  OnboardingV2FlowState,
  OnboardingV2Service,
} from '../types/flowState';
import { Step1BusinessNameAndType } from './Step1BusinessNameAndType';
import { Step2AddService } from './Step2AddService';
import { Step3Availability } from './Step3Availability';
import { Step4ClaimLink } from './Step4ClaimLink';
import { Step5Done } from './Step5Done';

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Business', 'Services', 'Hours', 'Link', 'Go live'];

const getInitialState = (): OnboardingV2FlowState => ({
  businessName: '',
  businessType: '',
  services: [],
  schedule: { ...DEFAULT_SCHEDULE },
  selectedPreset: 'mon_fri_9_5' as PresetKey,
  slug: '',
});

export interface OnboardingFlowV2Props {
  profileId: string;
  businessProfileId?: string;
  currentStep?: number;
  initialStep1?: { businessName: string; businessType: string };
  initialStep2?: { services: OnboardingV2Service[] };
  initialStep3?: {
    schedule?: WeeklySchedule;
    selectedPreset?: PresetKey | null;
  };
  initialStep4?: { slug?: string };
}

export const OnboardingFlowV2: React.FC<OnboardingFlowV2Props> = ({
  profileId,
  businessProfileId: initialBusinessProfileId,
  currentStep = 1,
  initialStep1,
  initialStep2,
  initialStep3,
  initialStep4,
}) => {
  const [step, setStep] = useState(() =>
    Math.min(Math.max(currentStep, 1), TOTAL_STEPS)
  );
  const [businessProfileId, setBusinessProfileId] = useState<
    string | undefined
  >(initialBusinessProfileId);
  const [state, setState] = useState<OnboardingV2FlowState>(() => {
    const base = getInitialState();
    if (initialStep1) {
      base.businessName = initialStep1.businessName ?? '';
      base.businessType = initialStep1.businessType ?? '';
    }
    if (initialStep2?.services?.length) {
      base.services = initialStep2.services;
    }
    if (initialStep3) {
      if (initialStep3.schedule) base.schedule = initialStep3.schedule;
      if (initialStep3.selectedPreset !== undefined)
        base.selectedPreset = initialStep3.selectedPreset;
    }
    if (initialStep4?.slug) base.slug = initialStep4.slug;
    return base;
  });

  useEffect(() => {
    if (initialBusinessProfileId) {
      setBusinessProfileId(initialBusinessProfileId);
    }
  }, [initialBusinessProfileId]);

  const updateState = useCallback((updates: Partial<OnboardingV2FlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleStep1Next = useCallback((newBusinessProfileId?: string) => {
    if (newBusinessProfileId) {
      setBusinessProfileId(newBusinessProfileId);
    }
    setStep(2);
  }, []);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1BusinessNameAndType
            profileId={profileId}
            businessProfileId={businessProfileId}
            businessName={state.businessName}
            businessType={state.businessType}
            onUpdate={updates =>
              updateState({
                businessName: updates.businessName ?? state.businessName,
                businessType: updates.businessType ?? state.businessType,
              })
            }
            onNext={handleStep1Next}
          />
        );
      case 2:
        return (
          <Step2AddService
            businessProfileId={businessProfileId}
            services={state.services}
            onUpdate={(services: OnboardingV2Service[]) =>
              updateState({ services })
            }
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <Step3Availability
            businessProfileId={businessProfileId}
            schedule={state.schedule}
            selectedPreset={state.selectedPreset}
            onUpdate={updates =>
              updateState({
                schedule: updates.schedule ?? state.schedule,
                selectedPreset:
                  updates.selectedPreset !== undefined
                    ? updates.selectedPreset
                    : state.selectedPreset,
              })
            }
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <Step4ClaimLink
            businessProfileId={businessProfileId}
            slug={state.slug}
            onUpdate={(slug: string) => updateState({ slug })}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        );
      case 5:
        return <Step5Done slug={state.slug} onBack={() => setStep(4)} />;
      default:
        return null;
    }
  };

  const showProgress = step >= 1 && step <= TOTAL_STEPS;

  return (
    <main className="flex flex-col flex-1 min-h-screen bg-[var(--dashboard-bg)]">
      <div className="flex-1 overflow-y-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto relative">
          {showProgress && (
            <div className="mb-6 sm:mb-8 md:mb-10">
              <p className="text-sm text-gray-400 mb-2">
                Step {step} of {TOTAL_STEPS}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      step > s
                        ? 'bg-white/30'
                        : step === s
                          ? 'bg-white'
                          : 'bg-white/10'
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {STEP_LABELS[step - 1]}
              </p>
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </main>
  );
};
