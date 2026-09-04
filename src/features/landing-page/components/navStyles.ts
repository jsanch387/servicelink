export const MARKETING_RESOURCES_MEGA_SLOT_ID = 'marketing-resources-mega';

export function desktopNavItemClass(active: boolean) {
  return `inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.01em] cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:gap-1.5 md:px-4 md:py-2 md:text-[15px] lg:px-5 lg:text-base ${
    active
      ? 'bg-white/[0.1] text-white'
      : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
  }`;
}

export function isNavPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
