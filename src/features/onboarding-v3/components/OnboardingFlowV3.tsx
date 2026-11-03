'use client';

import {
  API_ROUTES,
  getPublicBusinessProfilePath,
  ROUTES,
} from '@/constants/routes';
import { PREVIEW_MOTION_CSS } from '@/features/onboarding-preview/components/OnboardingPreviewFlow';
import { PreviewLiveScreen } from '@/features/onboarding-preview/components/PreviewLiveScreen';
import { PreviewStepBusiness } from '@/features/onboarding-preview/components/PreviewStepBusiness';
import { PreviewStepIndustry } from '@/features/onboarding-preview/components/PreviewStepIndustry';
import { slugFromBusinessName } from '@/features/onboarding-preview/slugPreview';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { checkOnboardingSlug } from '../checkOnboardingSlug';
import { setOwnerTestGuide, startOwnerTestGuide } from '../ownerTestGuide';

type FlowStep = 'industry' | 'business' | 'live';

interface OnboardingFlowV3Props {
  initialStep: 'industry' | 'business';
  industry: string;
  trades: string[];
  businessName: string;
  phone: string;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || 'Something went wrong';
  } catch {
    return 'Something went wrong';
  }
}

export function OnboardingFlowV3({
  initialStep,
  industry: initialIndustry,
  trades: initialTrades,
  businessName: initialBusinessName,
  phone: initialPhone,
}: OnboardingFlowV3Props) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [industry, setIndustry] = useState(initialIndustry);
  const [trades, setTrades] = useState(initialTrades);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [slugEdited, setSlugEdited] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [liveSlug, setLiveSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(
    (raw: string) => checkOnboardingSlug(raw),
    []
  );

  const continueIndustry = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.ONBOARDING_V3_STEP1, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, trades }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setStep('business');
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const finish = async (slug: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.ONBOARDING_V3_FINISH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          slug: slug || slugFromBusinessName(businessName),
          phone,
          industry,
          trades,
        }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        slug?: string;
        error?: string;
      };
      if (!response.ok || !body.success || !body.slug) {
        setError(body.error || 'Could not finish setup');
        return;
      }
      setLiveSlug(body.slug);
      setStep('live');
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const openBookingPage = () => {
    if (!liveSlug) return;
    startOwnerTestGuide();
    window.location.assign(getPublicBusinessProfilePath(liveSlug));
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[var(--dashboard-bg)] text-white">
      <style>{PREVIEW_MOTION_CSS}</style>
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {step === 'industry' ? (
            <PreviewStepIndustry
              compact={false}
              industry={industry}
              trades={trades}
              saving={saving}
              error={error}
              onIndustry={value => {
                setIndustry(value);
                setTrades([]);
              }}
              onTrades={setTrades}
              onContinue={() => {
                void continueIndustry();
              }}
            />
          ) : null}
          {step === 'business' ? (
            <PreviewStepBusiness
              compact={false}
              businessName={businessName}
              slugEdited={slugEdited}
              customSlug={customSlug}
              phone={phone}
              saving={saving}
              error={error}
              checkAvailability={checkAvailability}
              onBusinessName={setBusinessName}
              onSlugEdited={(edited, slug) => {
                setSlugEdited(edited);
                setCustomSlug(slug);
              }}
              onPhone={setPhone}
              onBack={() => {
                setError(null);
                setStep('industry');
              }}
              onFinish={slug => {
                void finish(slug);
              }}
            />
          ) : null}
          {step === 'live' ? (
            <PreviewLiveScreen
              compact={false}
              slug={liveSlug}
              onBookTest={openBookingPage}
              onSkip={() => {
                setOwnerTestGuide(null);
                router.push(ROUTES.DASHBOARD.MAIN);
                router.refresh();
              }}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
