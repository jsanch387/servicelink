'use client';

import { GlassCard } from '@/components/shared';
import { BookingVehicleFields } from '@/features/availability/booking/components/BookingVehicleFields';
import React from 'react';
import type { CreateAppointmentVehicle } from '../types';

export interface VehicleStepProps {
  vehicle: CreateAppointmentVehicle;
  onChange: (patch: Partial<CreateAppointmentVehicle>) => void;
}

export function VehicleStep({ vehicle, onChange }: VehicleStepProps) {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <BookingVehicleFields
        value={{
          vehicleYear: vehicle.year,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
        }}
        onChange={updates => {
          const patch: Partial<CreateAppointmentVehicle> = {};
          if (updates.vehicleYear !== undefined) patch.year = updates.vehicleYear;
          if (updates.vehicleMake !== undefined) patch.make = updates.vehicleMake;
          if (updates.vehicleModel !== undefined)
            patch.model = updates.vehicleModel;
          onChange(patch);
        }}
        required={false}
      />
    </GlassCard>
  );
}
