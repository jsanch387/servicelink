'use client';

import { GlassCard, Select } from '@/components/shared';
import { BookingVehicleFields } from '@/features/availability/booking/components/BookingVehicleFields';
import React from 'react';
import type { CreateAppointmentVehicle } from '../types';

const DIFFERENT_VEHICLE = 'custom';

export interface VehicleStepProps {
  vehicle: CreateAppointmentVehicle;
  onChange: (patch: Partial<CreateAppointmentVehicle>) => void;
  savedVehicles?: CreateAppointmentVehicle[];
}

function vehicleKey(vehicle: CreateAppointmentVehicle): string {
  return [vehicle.year, vehicle.make, vehicle.model]
    .map(part => part.trim().toLowerCase())
    .join('|');
}

function vehicleLabel(vehicle: CreateAppointmentVehicle): string {
  return [vehicle.year, vehicle.make, vehicle.model]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
}

export function VehicleStep({
  vehicle,
  onChange,
  savedVehicles = [],
}: VehicleStepProps) {
  const choices = savedVehicles.filter(
    item => item.year.trim() && item.make.trim() && item.model.trim()
  );
  const showChooser = choices.length > 1;
  const matchedIndex = choices.findIndex(
    item => vehicleKey(item) === vehicleKey(vehicle)
  );
  const selected = matchedIndex >= 0 ? String(matchedIndex) : DIFFERENT_VEHICLE;

  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <div className="space-y-4">
        {showChooser ? (
          <Select
            label="Saved vehicle"
            value={selected}
            onChange={value => {
              if (value === DIFFERENT_VEHICLE) {
                onChange({ year: '', make: '', model: '' });
                return;
              }
              const next = choices[Number(value)];
              if (!next) return;
              onChange({
                year: next.year.trim(),
                make: next.make.trim(),
                model: next.model.trim(),
              });
            }}
            options={[
              ...choices.map((item, index) => ({
                value: String(index),
                label: vehicleLabel(item),
              })),
              { value: DIFFERENT_VEHICLE, label: 'Different vehicle' },
            ]}
          />
        ) : null}
        <BookingVehicleFields
          value={{
            vehicleYear: vehicle.year,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
          }}
          onChange={updates => {
            const patch: Partial<CreateAppointmentVehicle> = {};
            if (updates.vehicleYear !== undefined)
              patch.year = updates.vehicleYear;
            if (updates.vehicleMake !== undefined)
              patch.make = updates.vehicleMake;
            if (updates.vehicleModel !== undefined)
              patch.model = updates.vehicleModel;
            onChange(patch);
          }}
          required={false}
        />
      </div>
    </GlassCard>
  );
}
