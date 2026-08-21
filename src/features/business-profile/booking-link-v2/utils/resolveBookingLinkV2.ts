import { isBookingLinkV2Enabled } from '../config/isBookingLinkV2Enabled';

export function parseBookingLinkV2QueryOverride(
  value: string | null | undefined
): boolean | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;
  return null;
}

/**
 * Whether to render Booking Link 2.0.
 * Master switch must be on. `?v2=1` / `?v2=0` can force either side for comparison.
 */
export function resolveShouldUseBookingLinkV2(options: {
  inRollout: boolean;
  queryOverride?: string | null;
}): boolean {
  if (!isBookingLinkV2Enabled()) return false;

  const override = parseBookingLinkV2QueryOverride(options.queryOverride);
  if (override != null) return override;

  return options.inRollout === true;
}
