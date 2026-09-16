import { BookingAssigneeField } from '@/features/availability/booking/dashboard/BookingAssigneeField';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const toastError = vi.fn();

vi.mock('@/components/shared', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

afterEach(() => {
  cleanup();
  toastError.mockClear();
});

const options = [
  { userId: 'user-1', label: 'alex@shop.com', kind: 'member' as const },
];

describe('BookingAssigneeField', () => {
  it('saves Unassigned as null', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ success: true });

    render(
      <BookingAssigneeField
        assignedUserId="user-1"
        options={options}
        onAssign={onAssign}
      />
    );

    await user.selectOptions(screen.getByLabelText(/assignee/i), '');

    expect(onAssign).toHaveBeenCalledWith(null);
  });

  it('shows a toast when save fails', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({
      success: false,
      error: 'That person is not on this shop.',
    });

    render(
      <BookingAssigneeField
        assignedUserId={null}
        options={options}
        onAssign={onAssign}
      />
    );

    await user.selectOptions(screen.getByLabelText(/assignee/i), 'user-1');

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'That person is not on this shop.'
      );
    });
  });
});
