import type { BookingV2CartItem } from '../types';

/** The line under a service: the vehicle, or the pet. Home jobs have neither. */
export function bookingV2ItemDetail(item: BookingV2CartItem): string {
  const petName = item.pet?.name.trim() ?? '';
  if (petName) {
    const breed = item.pet?.breed.trim() ?? '';
    return [petName, breed].filter(Boolean).join(' · ');
  }
  return [item.vehicle.year, item.vehicle.make, item.vehicle.model]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
}
