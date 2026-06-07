import { ServicesTabListHeader } from '@/features/services/components/ServicesTabListHeader';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => cleanup());

describe('ServicesTabListHeader', () => {
  it('renders the count label', () => {
    render(<ServicesTabListHeader countLabel="3 services" />);
    expect(screen.getByText('3 services')).toBeTruthy();
  });

  it('hides reorder when fewer than two items and not already reordering', () => {
    render(
      <ServicesTabListHeader
        countLabel="1 service"
        reorder={{
          onClick: vi.fn(),
          canReorder: false,
          isSaving: false,
          isReorderMode: false,
        }}
      />
    );

    expect(screen.queryByRole('button', { name: /reorder/i })).toBeNull();
  });

  it('shows reorder when two or more items can be sorted', () => {
    render(
      <ServicesTabListHeader
        countLabel="2 services"
        reorder={{
          onClick: vi.fn(),
          canReorder: true,
          isSaving: false,
          isReorderMode: false,
        }}
      />
    );

    const reorder = screen.getByRole('button', { name: /reorder/i });
    expect(reorder.className).toContain('text-white');
    expect(reorder.className).toContain('cursor-pointer');
  });

  it('shows Finish sorting while reorder mode is active', () => {
    render(
      <ServicesTabListHeader
        countLabel="2 categories"
        reorder={{
          onClick: vi.fn(),
          canReorder: false,
          isSaving: false,
          isReorderMode: true,
        }}
      />
    );

    expect(
      screen.getByRole('button', { name: /finish sorting/i })
    ).toBeTruthy();
  });
});
