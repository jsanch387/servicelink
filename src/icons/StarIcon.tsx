import { IoStarHalfSharp, IoStarOutline, IoStarSharp } from 'react-icons/io5';

/** Shared gold tone for review stars — change here to update app-wide. */
export const REVIEW_STAR_COLOR = '#EAB308';

export const reviewStarFilledClass = 'text-[#EAB308]';

export const reviewStarFilledBgClass = 'bg-[#EAB308]';

type StarIconProps = {
  className?: string;
};

/** Sharp filled star — pair with `reviewStarFilledClass` for review UI. */
export const StarIcon = ({ className }: StarIconProps) => (
  <IoStarSharp className={className} aria-hidden />
);

/** Sharp half star for partial ratings. */
export const StarHalfIcon = ({ className }: StarIconProps) => (
  <IoStarHalfSharp className={className} aria-hidden />
);

/** Outline star for empty / unfilled states. */
export const StarOutlineIcon = ({ className }: StarIconProps) => (
  <IoStarOutline className={className} aria-hidden />
);
