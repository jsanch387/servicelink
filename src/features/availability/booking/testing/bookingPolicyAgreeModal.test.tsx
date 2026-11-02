import { BookingPolicyAgreeModal } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

describe('BookingPolicyAgreeModal', () => {
  it('shows an error when continue is clicked without accepting', async () => {
    const user = userEvent.setup();
    const onAgreed = vi.fn();

    render(
      <BookingPolicyAgreeModal
        isOpen
        policyText="Cancel 24 hours ahead."
        onClose={vi.fn()}
        onAgreed={onAgreed}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert').textContent).toBe(
      'You must accept to continue.'
    );
    expect(onAgreed).not.toHaveBeenCalled();
  });

  it('continues after the checkbox is checked', async () => {
    const user = userEvent.setup();
    const onAgreed = vi.fn();

    render(
      <BookingPolicyAgreeModal
        isOpen
        policyText="Cancel 24 hours ahead."
        onClose={vi.fn()}
        onAgreed={onAgreed}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: /I agree to the booking policy/i })
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onAgreed).toHaveBeenCalledTimes(1);
  });
});
