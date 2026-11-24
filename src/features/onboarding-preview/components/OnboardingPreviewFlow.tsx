'use client';

import { US_PHONE_DIGIT_COUNT } from '@/lib/formatUsPhone';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { resolvePreviewSlug, slugFromBusinessName } from '../slugPreview';
import type { OnboardingPreviewSession, PreviewStep } from '../session';
import { seedPreviewForStep } from '../session';
import { PreviewChrome } from './PreviewChrome';
import { PreviewLiveScreen } from './PreviewLiveScreen';
import { PreviewRecapScreen } from './PreviewRecapScreen';
import { PreviewStepBusiness } from './PreviewStepBusiness';
import { PreviewStepIndustry } from './PreviewStepIndustry';

interface OnboardingPreviewFlowProps {
  session: OnboardingPreviewSession;
  onChange: (partial: Partial<OnboardingPreviewSession>) => void;
  onExit: () => void;
  onStartOver: () => void;
  onFinish: (bookedTest: boolean, calendarGuide?: boolean) => void;
}

export function OnboardingPreviewFlow({
  session,
  onChange,
  onExit,
  onStartOver,
  onFinish,
}: OnboardingPreviewFlowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const compact = session.surface === 'app';

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [session.step, session.surface]);

  const source = session.slugEdited
    ? session.customSlug
    : slugFromBusinessName(session.businessName);
  const resolved = resolvePreviewSlug(source);
  const slug =
    resolved.state === 'taken'
      ? resolved.suggestion
      : resolved.state === 'free'
        ? resolved.slug
        : 'your-link';

  const jump = (step: PreviewStep) => {
    const seeded = seedPreviewForStep(session, step);
    onChange(seeded);
  };

  const overlay = (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0f0f0f] text-white">
      <style>{PREVIEW_MOTION_CSS}</style>
      <PreviewChrome
        step={session.step}
        surface={session.surface}
        onJump={jump}
        onSurface={surface => onChange({ surface })}
        onStartOver={onStartOver}
        onExit={onExit}
      />
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div
          className={`mx-auto w-full px-4 py-8 sm:px-6 ${
            compact ? 'max-w-[390px]' : 'max-w-2xl'
          }`}
        >
          {session.step === 'industry' ? (
            <PreviewStepIndustry
              compact={compact}
              industry={session.industry}
              trades={session.trades}
              onIndustry={industry => onChange({ industry })}
              onTrades={trades => onChange({ trades })}
              onContinue={() => onChange({ step: 'business' })}
            />
          ) : null}
          {session.step === 'business' ? (
            <PreviewStepBusiness
              compact={compact}
              businessName={session.businessName}
              slugEdited={session.slugEdited}
              customSlug={session.customSlug}
              phone={session.phone}
              onBusinessName={businessName => onChange({ businessName })}
              onSlugEdited={(slugEdited, customSlug) =>
                onChange({ slugEdited, customSlug })
              }
              onPhone={phone => onChange({ phone })}
              onBack={() => onChange({ step: 'industry' })}
              onFinish={() => onChange({ step: 'live' })}
            />
          ) : null}
          {session.step === 'live' ? (
            <PreviewLiveScreen
              compact={compact}
              slug={slug}
              onBookTest={() => onFinish(true, true)}
              onSkip={() => onFinish(session.bookedTest, false)}
            />
          ) : null}
          {session.step === 'recap' ? (
            <PreviewRecapScreen
              compact={compact}
              showAppPitch={session.surface === 'web'}
              trade={session.trades[0]}
              phone={session.phone}
              receiptSeen={session.receiptSeen}
              linkTextSent={session.linkTextSent}
              onReceiptSeen={() => onChange({ receiptSeen: true })}
              onLinkTextSent={() => onChange({ linkTextSent: true })}
              onDashboard={() => onFinish(session.bookedTest)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export function previewHasPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= US_PHONE_DIGIT_COUNT;
}

export const PREVIEW_MOTION_CSS = `
  .onboarding-preview-rise {
    animation: onboarding-preview-rise 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes onboarding-preview-rise {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  .onboarding-preview-confetti {
    animation: onboarding-preview-confetti 1100ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes onboarding-preview-confetti {
    0% { transform: translate3d(0, -8px, 0) rotate(0deg); opacity: 0; }
    18% { opacity: 1; }
    100% { transform: translate3d(var(--confetti-drift, 0px), 120px, 0) rotate(140deg); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .onboarding-preview-rise { animation: none; }
    .onboarding-preview-confetti { display: none; }
  }
`;
