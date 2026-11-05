import { CustomerScreen } from '@/features/customer-management/components/CustomerScreen';
import { DashboardAccessProvider } from '@/features/dashboard/context/DashboardAccessContext';
import { fetchCustomerVehicles } from '@/features/customer-management/api/fetchCustomerVehicles';
import { fetchCustomerVisits } from '@/features/customer-management/api/fetchCustomerVisits';
import { fetchCustomersList } from '@/features/customer-management/api/fetchCustomers';
import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerListDate } from '@/features/customer-management/utils/customerListPresentation';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import { getOwnerCreateAppointmentForCustomerPath } from '@/constants/routes';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

vi.mock('@/features/customer-management/api/fetchCustomers', () => ({
  fetchCustomersList: vi.fn(),
}));

vi.mock('@/features/customer-management/api/fetchCustomerVisits', () => ({
  fetchCustomerVisits: vi.fn(),
}));

vi.mock('@/features/customer-management/api/fetchCustomerVehicles', () => ({
  fetchCustomerVehicles: vi.fn(),
}));

const fetchCustomersListMock = vi.mocked(fetchCustomersList);
const fetchCustomerVisitsMock = vi.mocked(fetchCustomerVisits);
const fetchCustomerVehiclesMock = vi.mocked(fetchCustomerVehicles);

beforeAll(() => {
  window.scrollTo = vi.fn();
});

const CUSTOMER_ID = 'e41ed3d4-aa2c-4ec6-ad9b-fffc0d01f616';

function customer(overrides: Partial<CustomerRecord> = {}): CustomerRecord {
  return {
    id: CUSTOMER_ID,
    name: 'Ada Lovelace',
    phone: '5125550100',
    email: 'ada@shop.com',
    lastService: 'Full detail',
    lastVisitDate: '2026-10-01',
    lastVisitDaysAgo: 30,
    nextAppointmentDate: '2026-11-12',
    nextAppointmentDaysUntil: 12,
    nextAppointmentService: 'Ceramic coat — Sedan',
    nextAppointmentServicePrice: 200,
    nextAppointmentAddOnDetails: [{ name: 'Wax', price: 25 }],
    totalVisits: 2,
    totalSpent: 300,
    maintenanceVisitsCompleted: 0,
    status: 'returning',
    note: 'Gate code 1234',
    ...overrides,
  };
}

function mockCustomer(
  record: CustomerRecord,
  businessType = 'Auto & Detailing'
) {
  fetchCustomersListMock.mockResolvedValue({
    ok: true,
    customers: [record],
    businessName: 'Ada Detailing',
    businessType,
    businessBookingLink: 'https://example.com/ada',
  });
  fetchCustomerVisitsMock.mockResolvedValue({
    ok: true,
    visits: [
      {
        id: 'visit-1',
        scheduledDate: '2026-10-01',
        serviceName: 'Full detail',
        price: 150,
      },
      {
        id: 'visit-2',
        scheduledDate: '2026-08-01',
        serviceName: 'Wash',
        price: 40,
      },
      {
        id: 'visit-3',
        scheduledDate: '2026-06-01',
        serviceName: 'Old wax',
        price: 20,
      },
    ],
  });
  fetchCustomerVehiclesMock.mockResolvedValue({ ok: true, vehicles: [] });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderScreen() {
  return render(
    <DashboardAccessProvider
      value={{ isOwner: true, role: 'owner', permissions: [] }}
    >
      <CustomerScreen customerId={CUSTOMER_ID} />
    </DashboardAccessProvider>
  );
}

describe('CustomerScreen', () => {
  it('features the upcoming appointment and hides View all', async () => {
    mockCustomer(customer());
    renderScreen();

    expect(await screen.findByText('Next visit')).toBeTruthy();
    expect(screen.queryByText('Last visit')).toBeNull();
    expect(screen.queryByText('View all')).toBeNull();
    expect(screen.getByText(formatCustomerListDate('2026-11-12'))).toBeTruthy();
    expect(
      screen.getByText(formatNextAppointmentRelativeDay('2026-11-12', 12))
    ).toBeTruthy();

    expect(screen.queryByText('Old wax')).toBeNull();
    expect(screen.getByText('Wash')).toBeTruthy();
    expect(screen.getByText('$225')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /new booking/i }).getAttribute('href')
    ).toBe(getOwnerCreateAppointmentForCustomerPath(CUSTOMER_ID));
    expect(screen.getByText('No vehicles yet')).toBeTruthy();
    expect(screen.queryByText(/shows up on every booking/i)).toBeNull();
  });

  it('keeps the last visit when nothing is upcoming', async () => {
    mockCustomer(
      customer({
        nextAppointmentDate: null,
        nextAppointmentDaysUntil: null,
        nextAppointmentService: undefined,
        nextAppointmentServicePrice: undefined,
        nextAppointmentAddOnDetails: undefined,
      }),
      'Beauty'
    );
    renderScreen();

    expect(await screen.findByText('Last visit')).toBeTruthy();
    expect(screen.queryByText('Next visit')).toBeNull();
    expect(screen.queryByText('Ceramic coat')).toBeNull();
    expect(screen.getByText('Full detail')).toBeTruthy();
    expect(screen.queryByText('No vehicles yet')).toBeNull();
  });

  it('opens call, message, and email from the menu', async () => {
    const user = userEvent.setup();
    mockCustomer(customer(), 'Beauty');
    renderScreen();

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'More' }));

    expect(
      screen.getByRole('menuitem', { name: 'Call' }).getAttribute('href')
    ).toBe('tel:+15125550100');
    expect(
      screen.getByRole('menuitem', { name: 'Message' }).getAttribute('href')
    ).toBe('sms:5125550100');
    expect(
      screen.getByRole('menuitem', { name: 'Email' }).getAttribute('href')
    ).toBe('mailto:ada@shop.com');
  });

  it('opens edit with the saved customer and asks before delete', async () => {
    const user = userEvent.setup();
    mockCustomer(customer(), 'Beauty');
    renderScreen();

    await screen.findByRole('button', { name: 'More' });
    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit customer' });
    expect(within(dialog).getByDisplayValue('Ada Lovelace')).toBeTruthy();
    expect(within(dialog).getByDisplayValue('ada@shop.com')).toBeTruthy();
    expect(within(dialog).getByDisplayValue('Gate code 1234')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Edit customer' })
      ).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('dialog', {
      name: 'Delete customer',
    });
    expect(within(confirm).getByText('Ada Lovelace')).toBeTruthy();
    expect(
      within(confirm).getByRole('button', { name: 'Delete customer' })
    ).toBeTruthy();
  });

  it('lists a saved vehicle and asks before removing it', async () => {
    const user = userEvent.setup();
    mockCustomer(customer());
    fetchCustomerVehiclesMock.mockResolvedValue({
      ok: true,
      vehicles: [{ id: 'veh-1', label: '2020 Honda Civic' }],
    });
    renderScreen();

    expect(await screen.findByText('2020 Honda Civic')).toBeTruthy();
    expect(screen.queryByText('No vehicles yet')).toBeNull();
    await user.click(
      screen.getByRole('button', { name: 'Remove 2020 Honda Civic' })
    );
    expect(
      await screen.findByRole('dialog', { name: 'Remove vehicle' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
  });
});
