'use client';

import React from 'react';

const STEPS = [
  { key: 1, label: 'Schedule' },
  { key: 2, label: 'Details' },
  { key: 3, label: 'Confirm' },
] as const;

interface StepperIndicatorProps {
  currentStep: 1 | 2 | 3;
  className?: string;
}

export const StepperIndicator: React.FC<StepperIndicatorProps> = ({
  currentStep,
  className = '',
}) => {
  return (
    <nav
      className={`flex items-center justify-center gap-2 sm:gap-4 py-4 border-b border-white/10 ${className}`}
      aria-label="Booking progress"
    >
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`
                  flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors
                  ${isActive ? 'bg-white text-black' : ''}
                  ${isCompleted ? 'bg-white/20 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-white/5 text-gray-500' : ''}
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </span>
              <span
                className={`
                  text-[10px] sm:text-xs font-medium
                  ${isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-500'}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-4 sm:w-8 rounded ${isCompleted ? 'bg-white/20' : 'bg-white/10'}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
};
