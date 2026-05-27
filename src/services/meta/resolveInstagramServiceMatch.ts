import type { InstagramBusinessContext } from '@/services/meta/loadInstagramBusinessContext';

export type InstagramServiceMatch = {
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number | null;
};

function serviceDurationMinutes(service: {
  durationMinutes: number | null;
  hoursToComplete?: number | null;
}): number {
  if (service.durationMinutes != null && service.durationMinutes > 0) {
    return Math.max(15, service.durationMinutes);
  }
  return 60;
}

export function resolveInstagramServiceMatch(
  context: InstagramBusinessContext,
  packageName: string | null | undefined
): InstagramServiceMatch | null {
  const name = packageName?.trim();
  if (!name) {
    return null;
  }

  const exact = context.services.find(
    s => s.name.toLowerCase() === name.toLowerCase()
  );
  const match =
    exact ??
    context.services.find(s =>
      s.name.toLowerCase().includes(name.toLowerCase())
    ) ??
    context.services.find(s =>
      name.toLowerCase().includes(s.name.toLowerCase())
    );

  if (!match) {
    return null;
  }

  return {
    serviceId: match.id,
    serviceName: match.name,
    durationMinutes: serviceDurationMinutes({
      durationMinutes: match.durationMinutes,
    }),
    priceCents: match.basePriceCents,
  };
}
