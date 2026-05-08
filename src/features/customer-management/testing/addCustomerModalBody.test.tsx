import { AddCustomerModalBody } from '@/features/customer-management/components/AddCustomerModalBody';
import { DUPLICATE_CUSTOMER_MESSAGE } from '@/features/customer-management/utils/parseCreateCustomerBody';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => cleanup());

describe('AddCustomerModalBody', () => {
  it('disables Add customer until name is filled', () => {
    const createCustomer = vi.fn();
    render(
      <AddCustomerModalBody
        onClose={() => {}}
        createCustomer={createCustomer}
      />
    );

    expect(
      screen.getByRole('button', { name: /add customer/i })
    ).toHaveProperty('disabled', true);

    expect(createCustomer).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email and does not call createCustomer', async () => {
    const user = userEvent.setup();
    const createCustomer = vi.fn();
    const { container } = render(
      <AddCustomerModalBody
        onClose={() => {}}
        createCustomer={createCustomer}
      />
    );

    await user.type(screen.getByPlaceholderText('Customer name'), 'Jane Doe');
    await user.type(
      screen.getByPlaceholderText('customer@email.com'),
      'not-valid'
    );
    // Bypass native `type="email"` constraint so React `onSubmit` runs (like programmatic POST).
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeTruthy();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it('submits minimal draft and shows success + Done closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const createCustomer = vi.fn().mockResolvedValue({ ok: true });

    render(
      <AddCustomerModalBody onClose={onClose} createCustomer={createCustomer} />
    );

    await user.type(screen.getByPlaceholderText('Customer name'), 'Jane Doe');
    await user.click(screen.getByRole('button', { name: /add customer/i }));

    await waitFor(() => {
      expect(screen.getByText(/customer added/i)).toBeTruthy();
    });

    expect(createCustomer).toHaveBeenCalledTimes(1);
    expect(createCustomer).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: '',
      phone: '',
      notes: '',
    });

    await user.click(screen.getByRole('button', { name: /^done$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows API duplicate error without success screen', async () => {
    const user = userEvent.setup();
    const createCustomer = vi
      .fn()
      .mockResolvedValue({ ok: false, error: DUPLICATE_CUSTOMER_MESSAGE });

    render(
      <AddCustomerModalBody
        onClose={() => {}}
        createCustomer={createCustomer}
      />
    );

    await user.type(screen.getByPlaceholderText('Customer name'), 'Jane Doe');
    await user.type(
      screen.getByPlaceholderText('customer@email.com'),
      'same@example.com'
    );
    await user.click(screen.getByRole('button', { name: /add customer/i }));

    await waitFor(() => {
      expect(screen.getByText(DUPLICATE_CUSTOMER_MESSAGE)).toBeTruthy();
    });

    expect(screen.queryByText(/customer added/i)).toBeNull();
  });

  it('notifies parent while submitting', async () => {
    const user = userEvent.setup();
    let resolveCreate!: (_value: { ok: true }) => void;
    const createPromise = new Promise<{ ok: true }>(resolve => {
      resolveCreate = resolve;
    });
    const createCustomer = vi.fn().mockReturnValue(createPromise);
    const onBusyChange = vi.fn();

    render(
      <AddCustomerModalBody
        onClose={() => {}}
        onBusyChange={onBusyChange}
        createCustomer={createCustomer}
      />
    );

    await user.type(screen.getByPlaceholderText('Customer name'), 'Pat');
    await user.click(screen.getByRole('button', { name: /add customer/i }));

    await waitFor(() => {
      expect(onBusyChange).toHaveBeenCalledWith(true);
    });

    resolveCreate!({ ok: true });

    await waitFor(() => {
      expect(screen.getByText(/customer added/i)).toBeTruthy();
      expect(onBusyChange).toHaveBeenCalledWith(false);
    });
  });

  it('Cancel calls onClose when idle', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddCustomerModalBody onClose={onClose} createCustomer={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
