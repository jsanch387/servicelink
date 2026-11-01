import { CustomerSearchAndFilters } from '@/features/customer-management/components/CustomerSearchAndFilters';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => cleanup());

describe('CustomerSearchAndFilters', () => {
  it('shows Import beside Add a customer for people who can write', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(
      <CustomerSearchAndFilters
        query=""
        onQueryChange={() => undefined}
        statusFilter="all"
        onStatusFilterChange={() => undefined}
        onAddCustomer={() => undefined}
        onImport={onImport}
      />
    );

    const importButton = screen.getByRole('button', { name: 'Import' });
    const filterButton = screen.getByRole('button', { name: 'Filter' });
    expect(importButton.className).toContain('h-9');
    expect(filterButton.className).toContain('h-9');
    expect(
      screen.getByRole('button', { name: 'Add a customer' }).className
    ).toContain('h-9');
    expect(screen.getByRole('button', { name: 'Add a customer' })).toBeTruthy();

    await user.click(importButton);
    expect(onImport).toHaveBeenCalledOnce();
  });

  it('hides Import when the person cannot add customers', () => {
    render(
      <CustomerSearchAndFilters
        query=""
        onQueryChange={() => undefined}
        statusFilter="all"
        onStatusFilterChange={() => undefined}
      />
    );

    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add a customer' })).toBeNull();
  });
});
