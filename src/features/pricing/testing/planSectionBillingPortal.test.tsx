import { PlanSection } from '@/features/pricing/components/PlanSection';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => cleanup());

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('PlanSection billing portal visibility', () => {
  it('hides Manage subscription for never-subscribed Free users', () => {
    render(<PlanSection planId="free" billingAction="checkout" />);

    expect(
      screen.queryByRole('button', { name: 'Manage subscription' })
    ).toBeNull();
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeTruthy();
  });

  it('shows Manage subscription after a failed payment downgrades the user to Free', () => {
    render(
      <PlanSection
        planId="free"
        subscriptionStatus="past_due"
        stripeCustomerId="cus_past_due"
        billingAction="update_payment"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Manage subscription' })
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: /upgrade/i })).toBeNull();
  });

  it('shows Manage subscription for any Free user with a Stripe customer id', () => {
    render(
      <PlanSection
        planId="free"
        stripeCustomerId="cus_churned"
        subscriptionStatus="canceled"
        billingAction="checkout"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Manage subscription' })
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeTruthy();
  });
});
