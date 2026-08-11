import type { SubscriptionCadenceUnit } from '../types/customerSubscriptionPlan';

const CADENCE_UNITS = new Set<SubscriptionCadenceUnit>([
  'week',
  'month',
  'year',
]);

type BodyCadence = {
  intervalUnit?: unknown;
  intervalCount?: unknown;
  priceCents?: unknown;
};

export type MembershipPlanWriteBody = {
  name: string;
  description: string;
  cadenceOptions: Array<{
    intervalUnit: SubscriptionCadenceUnit;
    intervalCount: number;
    priceCents: number;
  }>;
};

export function parseMembershipPlanWriteBody(
  raw: unknown
): { ok: true; value: MembershipPlanWriteBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid body' };
  }

  const body = raw as {
    name?: unknown;
    description?: unknown;
    cadenceOptions?: unknown;
  };

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return { ok: false, error: 'Plan name is required.' };
  }

  const description =
    typeof body.description === 'string' ? body.description : '';

  if (!Array.isArray(body.cadenceOptions) || body.cadenceOptions.length === 0) {
    return { ok: false, error: 'Add at least one pricing option.' };
  }

  const cadenceOptions: MembershipPlanWriteBody['cadenceOptions'] = [];
  const seen = new Set<string>();

  for (const item of body.cadenceOptions as BodyCadence[]) {
    const unit = item.intervalUnit;
    const count = item.intervalCount;
    const cents = item.priceCents;

    if (
      typeof unit !== 'string' ||
      !CADENCE_UNITS.has(unit as SubscriptionCadenceUnit)
    ) {
      return { ok: false, error: 'Invalid schedule option.' };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
      return { ok: false, error: 'Invalid schedule option.' };
    }
    if (typeof cents !== 'number' || !Number.isInteger(cents) || cents <= 0) {
      return { ok: false, error: 'Invalid price.' };
    }

    const key = `${unit}:${count}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: 'Duplicate schedule options are not allowed.',
      };
    }
    seen.add(key);

    cadenceOptions.push({
      intervalUnit: unit as SubscriptionCadenceUnit,
      intervalCount: count,
      priceCents: cents,
    });
  }

  return { ok: true, value: { name, description, cadenceOptions } };
}
