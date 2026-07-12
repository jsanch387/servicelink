import { LuCar } from 'react-icons/lu';

type VehicleIconProps = {
  className?: string;
};

/** Side-profile car for vehicle fields in booking / quote UI. */
export const VehicleIcon = ({ className }: VehicleIconProps) => (
  <LuCar className={className} aria-hidden />
);
