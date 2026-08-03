import { describe, expect, it } from 'vitest';
import { CREATE_APPOINTMENT_STEP } from '@/features/availability/booking/create-appointment/constants';
import {
  getCreateAppointmentVisibleStepOrder,
  getNextStepOnContinue,
  getPreviousStepOnBack,
  getStepAfterAddons,
} from '@/features/availability/booking/create-appointment/utils/createFlowNavigation';

describe('createFlowNavigation', () => {
  it('job 1 visible order includes customer, location, address, schedule', () => {
    expect(
      getCreateAppointmentVisibleStepOrder(false, false, false, false, 0)
    ).toEqual([
      CREATE_APPOINTMENT_STEP.SERVICE,
      CREATE_APPOINTMENT_STEP.PRICING,
      CREATE_APPOINTMENT_STEP.ADDONS,
      CREATE_APPOINTMENT_STEP.CUSTOMER,
      CREATE_APPOINTMENT_STEP.LOCATION,
      CREATE_APPOINTMENT_STEP.ADDRESS,
      CREATE_APPOINTMENT_STEP.VEHICLE,
      CREATE_APPOINTMENT_STEP.SCHEDULE,
      CREATE_APPOINTMENT_STEP.REVIEW,
    ]);
  });

  it('job 2+ skips customer/location/address/schedule in visible order', () => {
    expect(
      getCreateAppointmentVisibleStepOrder(true, true, true, true, 1)
    ).toEqual([
      CREATE_APPOINTMENT_STEP.SERVICE,
      CREATE_APPOINTMENT_STEP.VEHICLE,
      CREATE_APPOINTMENT_STEP.REVIEW,
    ]);
  });

  it('after add-ons on job 1 goes to customer', () => {
    expect(getStepAfterAddons({ jobIndex: 0 })).toBe(
      CREATE_APPOINTMENT_STEP.CUSTOMER
    );
  });

  it('after add-ons on job 2+ goes to vehicle', () => {
    expect(getStepAfterAddons({ jobIndex: 1 })).toBe(
      CREATE_APPOINTMENT_STEP.VEHICLE
    );
  });

  it('vehicle continue on job 1 always goes to schedule', () => {
    expect(
      getNextStepOnContinue({
        step: CREATE_APPOINTMENT_STEP.VEHICLE,
        pricingSkipped: false,
        addonsSkipped: false,
        jobIndex: 0,
        hasScheduleSlot: true,
      })
    ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
  });

  it('vehicle continue on job 2+ goes to review', () => {
    expect(
      getNextStepOnContinue({
        step: CREATE_APPOINTMENT_STEP.VEHICLE,
        pricingSkipped: false,
        addonsSkipped: false,
        jobIndex: 1,
        hasScheduleSlot: true,
      })
    ).toBe(CREATE_APPOINTMENT_STEP.REVIEW);
  });

  it('back from review on job 1 returns to schedule', () => {
    expect(
      getPreviousStepOnBack({
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        pricingSkipped: false,
        addonsSkipped: false,
        jobIndex: 0,
      })
    ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
  });
});
