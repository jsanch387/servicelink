'use client';

import { useState } from 'react';
import { PublicReviewForm } from './PublicReviewForm';
import { PublicReviewPageLayout } from './PublicReviewPageLayout';
import { PublicReviewSuccessCard } from './PublicReviewSuccessCard';

export type PublicReviewPageShellProps = {
  token: string;
  businessName: string;
  serviceName: string;
  visitLine?: string;
  customerGreetingName?: string;
};

export function PublicReviewPageShell({
  token,
  businessName,
  serviceName,
  visitLine,
  customerGreetingName,
}: PublicReviewPageShellProps) {
  const [submitted, setSubmitted] = useState(false);
  const greeting = customerGreetingName?.trim() || 'there';

  return (
    <PublicReviewPageLayout
      businessName={businessName}
      hideHeader={submitted}
      centerContent={submitted}
    >
      {submitted ? (
        <PublicReviewSuccessCard
          businessName={businessName}
          customerGreetingName={greeting}
        />
      ) : (
        <PublicReviewForm
          token={token}
          businessName={businessName}
          serviceName={serviceName}
          visitLine={visitLine}
          customerGreetingName={customerGreetingName}
          onSubmitted={() => setSubmitted(true)}
        />
      )}
    </PublicReviewPageLayout>
  );
}
