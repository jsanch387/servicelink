export const SERVICE_RADIUS_MILES = [
  5, 10, 15, 20, 25, 30, 40, 50, 75, 100,
] as const;

export type ServiceRadiusMiles = (typeof SERVICE_RADIUS_MILES)[number];

export const DEFAULT_SERVICE_RADIUS_MILES: ServiceRadiusMiles = 25;

export const SERVICE_RADIUS_OPTIONS = SERVICE_RADIUS_MILES.map(miles => ({
  value: String(miles),
  label: `${miles} miles`,
}));

export function normalizeServiceRadiusMiles(value: number): ServiceRadiusMiles {
  if ((SERVICE_RADIUS_MILES as readonly number[]).includes(value)) {
    return value as ServiceRadiusMiles;
  }

  return SERVICE_RADIUS_MILES.reduce((best, miles) =>
    Math.abs(miles - value) < Math.abs(best - value) ? miles : best
  );
}
