export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const DAY_PIXELS_PER_HOUR = 56;
export const WEEK_PIXELS_PER_HOUR = 104;
export const TIME_LABEL_PAD_PX = 14;

export function hourRange(startHour: number, endHour: number): number[] {
  return Array.from(
    { length: endHour - startHour + 1 },
    (_, index) => startHour + index
  );
}

export function slotHours(startHour: number, endHour: number): number[] {
  return hourRange(startHour, endHour).slice(0, -1);
}

export function gridHeightPx(
  startHour: number,
  endHour: number,
  pixelsPerHour: number
): number {
  return (endHour - startHour) * pixelsPerHour;
}
