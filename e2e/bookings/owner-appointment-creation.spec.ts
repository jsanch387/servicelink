import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  cancelOwnerBooking,
  completeOwnerBookingDetails,
  openNewOwnerAppointment,
  startCustomOwnerJob,
  startFirstCatalogOwnerService,
  submitOwnerBooking,
  uniqueOwnerBookingCustomer,
  waitForOwnerBooking,
} from '../fixtures/owner-booking-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Owner appointment creation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(180_000);
    await loginAsOwner(page);
  });

  test('creates a custom mobile job with owner notes and optional contact fields', async ({
    page,
  }) => {
    const customer = uniqueOwnerBookingCustomer('Custom', {
      email: '',
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      notes: 'E2E owner note: use the side entrance.',
    });
    const customJobName = `E2E Custom Job ${Date.now()}`;
    let bookingId: string | null = null;

    try {
      await openNewOwnerAppointment(page);
      await startCustomOwnerJob(page, {
        name: customJobName,
        priceDollars: '125',
        notes: customer.notes,
      });
      const fields = await completeOwnerBookingDetails(
        page,
        customer,
        'mobile'
      );
      expect(fields.notesFieldShown).toBe(true);

      await expect(page.getByText(customJobName).first()).toBeVisible();
      await expect(page.getByText(customer.notes!).first()).toBeVisible();

      const created = await submitOwnerBooking(page);
      expect(created.responseStatus).toBe(201);
      expect(created.responseBody.success).toBe(true);
      bookingId = created.responseBody.data?.id ?? null;
      expect(bookingId).toBeTruthy();

      expect(created.payload).toMatchObject({
        serviceName: customJobName,
        servicePriceCents: 12_500,
        durationMinutes: 60,
        ownerManualBooking: true,
        customer: {
          fullName: customer.fullName,
          email: '',
          phone: customer.phone,
          vehicleYear: '',
          vehicleMake: '',
          vehicleModel: '',
          notes: customer.notes,
        },
      });
      expect(created.payload).not.toHaveProperty('serviceId');
      expect(created.payload).not.toHaveProperty('servicePriceOptionLabel');

      const persisted = await waitForOwnerBooking(page, bookingId!);
      expect(persisted).toMatchObject({
        id: bookingId,
        bookingSource: 'owner',
        customerName: customer.fullName,
        customerEmail: '',
        serviceName: customJobName,
        serviceDurationMinutes: 60,
        servicePriceCents: 12_500,
        notes: customer.notes,
        status: 'confirmed',
      });
      expect(persisted.customerVehicleYear).toBeUndefined();
      expect(persisted.customerVehicleMake).toBeUndefined();
      expect(persisted.customerVehicleModel).toBeUndefined();
      expect(persisted.addonDetails).toEqual([]);
    } finally {
      await cancelOwnerBooking(page, bookingId);
    }
  });

  test('creates a catalog appointment with option/add-on snapshots when configured', async ({
    page,
  }) => {
    const customer = uniqueOwnerBookingCustomer('Catalog', {
      notes: 'E2E catalog appointment note.',
    });
    let bookingId: string | null = null;

    try {
      await openNewOwnerAppointment(page);
      const selection = await startFirstCatalogOwnerService(page);
      const fields = await completeOwnerBookingDetails(page, customer, 'shop');
      expect(fields.notesFieldShown).toBe(true);

      const created = await submitOwnerBooking(page);
      expect(created.responseStatus).toBe(201);
      expect(created.responseBody.success).toBe(true);
      bookingId = created.responseBody.data?.id ?? null;
      expect(bookingId).toBeTruthy();

      expect(created.payload).toMatchObject({
        ownerManualBooking: true,
        customer: {
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          vehicleYear: fields.vehicleFieldsShown ? customer.vehicleYear : '',
          vehicleMake: fields.vehicleFieldsShown ? customer.vehicleMake : '',
          vehicleModel: fields.vehicleFieldsShown ? customer.vehicleModel : '',
          notes: customer.notes,
        },
      });
      expect(created.payload.serviceId).toEqual(expect.any(String));
      expect(created.payload.serviceName).toEqual(expect.any(String));
      expect(created.payload.servicePriceCents).toEqual(expect.any(Number));
      expect(created.payload.durationMinutes).toEqual(expect.any(Number));

      if (selection.selectedPriceOption) {
        expect(created.payload.servicePriceOptionLabel).toEqual(
          expect.any(String)
        );
      }
      if (selection.selectedAddOn) {
        expect(created.payload.selectedAddOns).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              priceCents: expect.any(Number),
            }),
          ])
        );
      }

      const persisted = await waitForOwnerBooking(page, bookingId!);
      expect(persisted).toMatchObject({
        id: bookingId,
        bookingSource: 'owner',
        customerName: customer.fullName,
        customerEmail: customer.email,
        notes: customer.notes,
        status: 'confirmed',
      });
      if (fields.vehicleFieldsShown) {
        expect(persisted).toMatchObject({
          customerVehicleYear: customer.vehicleYear,
          customerVehicleMake: customer.vehicleMake,
          customerVehicleModel: customer.vehicleModel,
        });
      } else {
        expect(persisted.customerVehicleYear).toBeUndefined();
        expect(persisted.customerVehicleMake).toBeUndefined();
        expect(persisted.customerVehicleModel).toBeUndefined();
      }
      expect(persisted.serviceName).not.toBe('');
      expect(persisted.serviceDurationMinutes).toBeGreaterThan(0);
      if (selection.selectedAddOn) {
        expect(persisted.addonDetails.length).toBeGreaterThan(0);
      }
    } finally {
      await cancelOwnerBooking(page, bookingId);
    }
  });
});
