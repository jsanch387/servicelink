'use client';

import { Button, Modal } from '@/components/shared';
import React, { useState } from 'react';

const steps = [
  {
    title: 'After a visit',
    body: 'When you mark a visit done, we text your customer a link to review you. No phone number? We email the link instead.',
  },
  {
    title: 'One review each',
    body: 'Each customer can review you once. We don’t ask again if they already did. The link works one time and lasts 90 days.',
  },
  {
    title: 'Your reply',
    body: 'Write a reply on this page. It shows under their review on your public page.',
  },
  {
    title: 'Google reviews',
    body: 'Connect Google and your reviews come over on their own. They show with a Google label. They don’t change your star rating.',
  },
] as const;

interface ReviewsHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewsHowItWorksModal: React.FC<ReviewsHowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const closeModal = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={current.title}
      maxWidth="sm"
    >
      <p className="min-h-16 text-sm leading-relaxed text-zinc-300">
        {current.body}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-1.5"
          aria-label={`Step ${step + 1} of ${steps.length}`}
        >
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={item.title}
              aria-current={index === step ? 'step' : undefined}
              onClick={() => setStep(index)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                index === step ? 'w-4 bg-white' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStep(index => index - 1)}
            >
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            variant="inverse"
            size="sm"
            onClick={() => {
              if (isLast) {
                closeModal();
                return;
              }
              setStep(index => index + 1);
            }}
          >
            {isLast ? 'Done' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
