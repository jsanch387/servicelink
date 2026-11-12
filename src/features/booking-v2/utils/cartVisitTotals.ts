import type { BookingV2CartItem } from '../types';

export function cartVisitTotals(items: BookingV2CartItem[]): {
  dueCents: number;
  originalCents: number;
  durationMinutes: number;
} {
  return items.reduce(
    (totals, item) => ({
      dueCents: totals.dueCents + item.dueCents,
      originalCents: totals.originalCents + item.originalCents,
      durationMinutes: totals.durationMinutes + item.durationMinutes,
    }),
    { dueCents: 0, originalCents: 0, durationMinutes: 0 }
  );
}
