import { isValidEmail } from '@/features/auth/utils/validation';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import type { MembershipServiceDetailsValue } from '../components/MembershipServiceDetailsFields';

export function isMembershipContactComplete(
  value: MembershipServiceDetailsValue
): boolean {
  if (!value.fullName.trim()) return false;
  if (!isValidEmail(value.email.trim())) return false;
  return normalizeUsPhoneDigits(value.phone).length === 10;
}

export function isMembershipAddressComplete(
  value: MembershipServiceDetailsValue
): boolean {
  const street = value.street.trim();
  const city = value.city.trim();
  const state = value.state.trim();
  const zip = value.zip.replace(/\D/g, '');
  return Boolean(street && city && state.length === 2 && zip.length === 5);
}

export function isMembershipVehicleComplete(
  value: MembershipServiceDetailsValue
): boolean {
  return Boolean(
    value.vehicleYear.trim().length === 4 &&
      value.vehicleMake.trim() &&
      value.vehicleModel.trim()
  );
}

export function isMembershipServiceDetailsComplete(args: {
  value: MembershipServiceDetailsValue;
  needsAddress: boolean;
  needsVehicle: boolean;
  /** Period rebook: vehicle is on the plan and cannot be edited. */
  vehicleLocked?: boolean;
}): boolean {
  if (args.needsAddress && !isMembershipAddressComplete(args.value)) {
    return false;
  }
  if (
    args.needsVehicle &&
    !args.vehicleLocked &&
    !isMembershipVehicleComplete(args.value)
  ) {
    return false;
  }
  return true;
}
