import { BookingSummary } from '@/features/availability/booking/components/BookingSummary';
import {
  CustomerForm,
  isCustomerFormValid,
} from '@/features/availability/booking/components/CustomerForm';
import type { CustomerFormData } from '@/features/availability/booking/types';
import { INITIAL_CUSTOMER_FORM_DATA } from '@/features/availability/booking/utils/initialFormData';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/availability/booking/components/BookingPriceBreakdown',
  () => ({
    BookingPriceBreakdown: () => <div data-testid="price-breakdown" />,
  })
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function filledCustomer(
  overrides: Partial<CustomerFormData> = {}
): CustomerFormData {
  return {
    ...INITIAL_CUSTOMER_FORM_DATA,
    fullName: 'Jane Doe',
    email: '',
    phone: '5551234567',
    streetAddress: '123 Main St',
    unitApt: '',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    notes: '',
    ...overrides,
  };
}

describe('isCustomerFormValid (optional email)', () => {
  const base = filledCustomer();

  it('returns true when email is optional, empty, and other required fields are filled', () => {
    expect(isCustomerFormValid(base, false, true)).toBe(true);
  });

  it('returns false when email is optional but invalid when non-empty', () => {
    expect(
      isCustomerFormValid({ ...base, email: 'not-an-email' }, false, true)
    ).toBe(false);
  });

  it('returns true when email is optional and valid', () => {
    expect(
      isCustomerFormValid({ ...base, email: 'jane@example.com' }, false, true)
    ).toBe(true);
  });

  it('returns false when email is required and empty', () => {
    expect(isCustomerFormValid(base, false, false)).toBe(false);
  });

  it('returns false when email is required and invalid', () => {
    expect(
      isCustomerFormValid({ ...base, email: 'not-an-email' }, false, false)
    ).toBe(false);
  });

  it('returns true when email is required and valid', () => {
    expect(
      isCustomerFormValid({ ...base, email: 'jane@example.com' }, false, false)
    ).toBe(true);
  });

  it('returns false for invalid US ZIP', () => {
    expect(isCustomerFormValid({ ...base, zip: '1234' }, false, true)).toBe(
      false
    );
    expect(isCustomerFormValid({ ...base, zip: '123456' }, false, true)).toBe(
      false
    );
  });

  it('returns true for 5- or 9-digit US ZIP', () => {
    expect(isCustomerFormValid({ ...base, zip: '78701' }, false, true)).toBe(
      true
    );
    expect(
      isCustomerFormValid({ ...base, zip: '787011234' }, false, true)
    ).toBe(true);
  });

  it('validates vehicle year when vehicle fields are required', () => {
    const withVehicle = {
      ...base,
      vehicleYear: '1899',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
    };
    expect(isCustomerFormValid(withVehicle, true, true)).toBe(false);
    expect(
      isCustomerFormValid({ ...withVehicle, vehicleYear: '2024' }, true, true)
    ).toBe(true);
  });
});

function CustomerFormHarness(props: {
  initial: CustomerFormData;
  emailOptional?: boolean;
  onSubmit: () => void;
}) {
  const { initial, emailOptional = true, onSubmit } = props;
  const [value, setValue] = React.useState<CustomerFormData>(initial);
  return (
    <CustomerForm
      id="customer-form-test"
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      emailOptional={emailOptional}
      hideSubmitButton={false}
      bookingFlowLocale="en"
    />
  );
}

describe('CustomerForm optional email UI', () => {
  it('shows the no-confirmation hint when email is optional and email is empty', () => {
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness initial={filledCustomer()} onSubmit={onSubmit} />
    );

    expect(
      screen.getByText(
        /Without an email address, no booking confirmation email will be sent\./i
      )
    ).toBeTruthy();
    expect(screen.getByText('Email (optional)')).toBeTruthy();
  });

  it('hides the hint after the user enters an email', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness initial={filledCustomer()} onSubmit={onSubmit} />
    );

    await user.type(screen.getByPlaceholderText('jane@example.com'), 'a@b.co');

    expect(
      screen.queryByText(
        /Without an email address, no booking confirmation email will be sent\./i
      )
    ).toBeNull();
  });

  it('shows a small live hint while the email format is invalid, then clears when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness initial={filledCustomer()} onSubmit={onSubmit} />
    );

    const input = screen.getByPlaceholderText('jane@example.com');
    await user.type(input, 'not');

    expect(
      screen.getByText(publicBookingUi('en').customerForm.errEmailInvalid)
    ).toBeTruthy();

    await user.clear(input);
    await user.type(input, 'a@b.co');

    expect(
      screen.queryByText(publicBookingUi('en').customerForm.errEmailInvalid)
    ).toBeNull();
  });

  it('does not show the optional-email hint when email is required', () => {
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness
        initial={filledCustomer()}
        emailOptional={false}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.queryByText(
        /Without an email address, no booking confirmation email will be sent\./i
      )
    ).toBeNull();
    expect(screen.queryByText('Email (optional)')).toBeNull();
    expect(screen.getByPlaceholderText('jane@example.com')).toBeTruthy();
  });

  it('submits without an email when optional and other fields are valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness initial={filledCustomer()} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole('button', { name: /review booking/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('blocks submit and shows invalid email when optional but email is non-empty and invalid', () => {
    const onSubmit = vi.fn();
    render(
      <CustomerFormHarness
        initial={filledCustomer({ email: 'bad' })}
        onSubmit={onSubmit}
      />
    );

    // Native `type="email"` constraint validation can block click-submit before
    // React runs `validate()`; fire `submit` so app validation + error UI are exercised.
    const form = document.getElementById('customer-form-test');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(publicBookingUi('en').customerForm.errEmailInvalid)
    ).toBeTruthy();
  });
});

describe('BookingSummary when email omitted', () => {
  const summaryProps = {
    serviceName: 'Detail',
    serviceDurationMinutes: 60,
    servicePriceCents: 10000,
    date: '2026-06-01',
    startTimeHhmm: '10:00',
    customer: filledCustomer({ email: '' }),
    bookingFlowLocale: 'en' as const,
  };

  it('shows email-not-provided copy in the contact section', () => {
    render(<BookingSummary {...summaryProps} />);

    expect(screen.getByText('No email provided')).toBeTruthy();
    expect(screen.queryByText(/@example\.com$/)).toBeNull();
  });

  it('shows the customer email when present', () => {
    render(
      <BookingSummary
        {...summaryProps}
        customer={filledCustomer({ email: '  hi@example.com  ' })}
      />
    );

    expect(screen.getByText('hi@example.com')).toBeTruthy();
    expect(screen.queryByText('No email provided')).toBeNull();
  });
});
