import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CustomerForm,
  type CustomerFormStep,
} from '@/features/availability/booking/components/CustomerForm';
import type { CustomerFormData } from '@/features/availability/booking/types';
import { INITIAL_CUSTOMER_FORM_DATA } from '@/features/availability/booking/utils/initialFormData';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_NOTES_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';

const notesCounterPattern = new RegExp(
  `^\\d+\\/${BOOKING_CUSTOMER_NOTES_MAX}$`
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function baseCustomer(
  overrides: Partial<CustomerFormData> = {}
): CustomerFormData {
  return {
    ...INITIAL_CUSTOMER_FORM_DATA,
    fullName: 'Jane Doe',
    email: 'jane@example.com',
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

function CustomerFormHarness(props: {
  initial: CustomerFormData;
  step?: CustomerFormStep;
  showVehicleFields?: boolean;
  onSubmit: () => void;
}) {
  const {
    initial,
    step = 'contact',
    showVehicleFields = false,
    onSubmit,
  } = props;
  const [value, setValue] = React.useState<CustomerFormData>(initial);
  return (
    <CustomerForm
      id="customer-form-input-test"
      step={step}
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      showVehicleFields={showVehicleFields}
      hideSubmitButton={false}
      bookingFlowLocale="en"
      emailOptional={false}
    />
  );
}

describe('CustomerForm input constraints (public booking details)', () => {
  it('ZIP field keeps digits only and drops letters as the user types', async () => {
    const user = userEvent.setup();
    render(
      <CustomerFormHarness
        initial={baseCustomer({ zip: '' })}
        step="address"
        onSubmit={vi.fn()}
      />
    );
    const zipInput = screen.getByPlaceholderText('78701') as HTMLInputElement;
    await user.type(zipInput, '78a70b1');
    expect(zipInput.value).toBe('78701');
  });

  it('ZIP field accepts at most 5 digits', async () => {
    const user = userEvent.setup();
    render(
      <CustomerFormHarness
        initial={baseCustomer({ zip: '' })}
        step="address"
        onSubmit={vi.fn()}
      />
    );
    const zipInput = screen.getByPlaceholderText('78701') as HTMLInputElement;
    await user.type(zipInput, '12345678901234');
    expect(zipInput.value).toHaveLength(5);
    expect(zipInput.value).toBe('12345');
  });

  it('vehicle year keeps digits only and caps at 4 characters', async () => {
    const user = userEvent.setup();
    render(
      <CustomerFormHarness
        initial={baseCustomer({
          vehicleYear: '',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
        })}
        step="vehicleNotes"
        showVehicleFields
        onSubmit={vi.fn()}
      />
    );
    const yearInput = screen.getByPlaceholderText('2018') as HTMLInputElement;
    await user.type(yearInput, '999999');
    expect(yearInput.value).toBe('9999');
    expect(yearInput.value).toHaveLength(4);
  });

  it('vehicle make and model reject digits as the user types', async () => {
    const user = userEvent.setup();
    render(
      <CustomerFormHarness
        initial={baseCustomer({
          vehicleYear: '2020',
          vehicleMake: '',
          vehicleModel: '',
        })}
        step="vehicleNotes"
        showVehicleFields
        onSubmit={vi.fn()}
      />
    );
    const makeInput = screen.getByPlaceholderText('Toyota') as HTMLInputElement;
    const modelInput = screen.getByPlaceholderText('Camry') as HTMLInputElement;
    await user.type(makeInput, 'Toy0ta');
    await user.type(modelInput, 'Camry123');
    expect(makeInput.value).toBe('Toyta');
    expect(modelInput.value).toBe('Camry');
  });

  it('truncates street address to max length on input', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="address"
        onSubmit={vi.fn()}
      />
    );
    const street = screen.getByPlaceholderText(
      '123 Main St'
    ) as HTMLInputElement;
    const long = 'a'.repeat(BOOKING_CUSTOMER_STREET_MAX + 30);
    fireEvent.change(street, { target: { value: long } });
    expect(street.value).toHaveLength(BOOKING_CUSTOMER_STREET_MAX);
  });

  it('truncates city to max length on input', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="address"
        onSubmit={vi.fn()}
      />
    );
    const city = screen.getByPlaceholderText('City') as HTMLInputElement;
    const long = 'b'.repeat(BOOKING_CUSTOMER_CITY_MAX + 20);
    fireEvent.change(city, { target: { value: long } });
    expect(city.value).toHaveLength(BOOKING_CUSTOMER_CITY_MAX);
  });

  it('truncates full name to max length on input', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="contact"
        onSubmit={vi.fn()}
      />
    );
    const name = screen.getByPlaceholderText('Jane Doe') as HTMLInputElement;
    const long = 'c'.repeat(BOOKING_CUSTOMER_FULL_NAME_MAX + 15);
    fireEvent.change(name, { target: { value: long } });
    expect(name.value).toHaveLength(BOOKING_CUSTOMER_FULL_NAME_MAX);
  });

  it('truncates unit / apt to max length on input', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="address"
        onSubmit={vi.fn()}
      />
    );
    const unit = screen.getByPlaceholderText('Apt 4B') as HTMLInputElement;
    const long = 'd'.repeat(BOOKING_CUSTOMER_UNIT_MAX + 10);
    fireEvent.change(unit, { target: { value: long } });
    expect(unit.value).toHaveLength(BOOKING_CUSTOMER_UNIT_MAX);
  });

  it('truncates notes to max length on input', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="vehicleNotes"
        onSubmit={vi.fn()}
      />
    );
    const notes = screen.getByPlaceholderText(
      /Any special requests/i
    ) as HTMLTextAreaElement;
    const long = 'e'.repeat(BOOKING_CUSTOMER_NOTES_MAX + 40);
    fireEvent.change(notes, { target: { value: long } });
    expect(notes.value).toHaveLength(BOOKING_CUSTOMER_NOTES_MAX);
  });

  it('does not render a notes character counter (e.g. 0/280)', () => {
    render(
      <CustomerFormHarness
        initial={baseCustomer()}
        step="vehicleNotes"
        onSubmit={vi.fn()}
      />
    );
    const matches = screen.queryAllByText(notesCounterPattern);
    expect(matches).toHaveLength(0);
  });
});
