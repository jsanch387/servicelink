/**
 * Mock data for Availability Booking dashboard (V2).
 * UI only – no API. Simulates upcoming, past, and cancelled bookings.
 */

import type { AvailabilityBookingDisplay } from './types';

const now = new Date();
const todayStr = now.toISOString().slice(0, 10);

export const MOCK_AVAILABILITY_BOOKINGS: AvailabilityBookingDisplay[] = [
  {
    id: 'av-1',
    customerName: 'Sarah Chen',
    customerPhone: '5551234567',
    customerEmail: 'sarah.chen@example.com',
    serviceName: 'Full Detail',
    serviceDurationMinutes: 120,
    servicePriceCents: 15000,
    date: todayStr,
    time: '2:30 PM',
    status: 'confirmed',
    address: {
      street: '124 Oak Lane',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    },
    notes: 'Please use the driveway on the left.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'av-2',
    customerName: 'Marcus Johnson',
    customerPhone: '5559876543',
    customerEmail: 'marcus.j@example.com',
    serviceName: 'Interior Clean',
    serviceDurationMinutes: 90,
    servicePriceCents: 8500,
    date: getDateOffset(1),
    time: '10:00 AM',
    status: 'confirmed',
    address: {
      street: '450 Maple St',
      unitApt: 'Unit 2B',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
    },
    notes: '',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'av-3',
    customerName: 'Elena Rodriguez',
    customerPhone: '5552468135',
    customerEmail: 'elena.r@example.com',
    serviceName: 'Exterior Wash',
    serviceDurationMinutes: 60,
    servicePriceCents: 4500,
    date: getDateOffset(2),
    time: '9:00 AM',
    status: 'confirmed',
    address: {
      street: '88 River Rd',
      city: 'Austin',
      state: 'TX',
      zip: '78703',
    },
    notes: 'Gate code: 4521',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'av-4',
    customerName: 'James Wilson',
    customerPhone: '5553698520',
    customerEmail: 'j.wilson@example.com',
    serviceName: 'Full Detail',
    serviceDurationMinutes: 120,
    servicePriceCents: 15000,
    date: getDateOffset(3),
    time: '1:00 PM',
    status: 'confirmed',
    address: {
      street: '200 Park Blvd',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
    },
    notes: '',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'av-5',
    customerName: 'Lisa Park',
    customerPhone: '5557419630',
    customerEmail: 'lisa.park@example.com',
    serviceName: 'Interior Clean',
    serviceDurationMinutes: 90,
    servicePriceCents: 8500,
    date: getDateOffset(-1),
    time: '11:00 AM',
    status: 'completed',
    address: {
      street: '55 Cedar Ave',
      city: 'Austin',
      state: 'TX',
      zip: '78705',
    },
    notes: '',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'av-6',
    customerName: 'David Kim',
    customerPhone: '5558520741',
    customerEmail: 'd.kim@example.com',
    serviceName: 'Exterior Wash',
    serviceDurationMinutes: 60,
    servicePriceCents: 4500,
    date: getDateOffset(4),
    time: '3:00 PM',
    status: 'cancelled',
    address: {
      street: '100 Pine St',
      city: 'Austin',
      state: 'TX',
      zip: '78706',
    },
    notes: 'Customer rescheduled elsewhere.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getDateOffset(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
