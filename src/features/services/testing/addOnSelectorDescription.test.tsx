import { AddOnSelector } from '@/features/services/booking-flow/AddOnSelector';
import type { ServiceAddOn } from '@/features/services/booking-flow/types';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

const WITH_DESCRIPTION: ServiceAddOn = {
  id: 'addon-1',
  name: 'Pet Hair Removal',
  description: 'Deep vacuum of seats and carpets to lift embedded pet hair.',
  priceCents: 2500,
  durationMinutes: 30,
};

const WITHOUT_DESCRIPTION: ServiceAddOn = {
  id: 'addon-2',
  name: 'Tire Shine',
  description: null,
  priceCents: 2000,
  durationMinutes: null,
};

function renderSelector(addOns: ServiceAddOn[], onToggle = vi.fn()) {
  render(
    <AddOnSelector
      addOns={addOns}
      selectedIds={new Set<string>()}
      onToggle={onToggle}
    />
  );
  return { onToggle };
}

describe('AddOnSelector description toggle', () => {
  it('hides the description until the customer asks to see it', async () => {
    const user = userEvent.setup();
    renderSelector([WITH_DESCRIPTION]);

    expect(screen.queryByText(/Deep vacuum of seats/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'See description' }));

    expect(screen.getByText(/Deep vacuum of seats/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Hide description' }));

    expect(screen.queryByText(/Deep vacuum of seats/)).toBeNull();
  });

  it('omits the toggle for add-ons without a description', () => {
    renderSelector([WITHOUT_DESCRIPTION]);

    expect(
      screen.queryByRole('button', { name: 'See description' })
    ).toBeNull();
  });

  it('does not change the selection when the description is toggled', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderSelector([WITH_DESCRIPTION]);

    await user.click(screen.getByRole('button', { name: 'See description' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('uses localized labels when provided', () => {
    render(
      <AddOnSelector
        addOns={[WITH_DESCRIPTION]}
        selectedIds={new Set<string>()}
        onToggle={vi.fn()}
        labels={{
          seeDescription: 'Ver descripción',
          hideDescription: 'Ocultar descripción',
        }}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Ver descripción' })
    ).toBeTruthy();
  });
});
