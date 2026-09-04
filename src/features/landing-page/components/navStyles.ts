/** Space below the fixed marketing nav so page content is not covered. */
export const MARKETING_NAV_SPACER_CLASS = 'h-16 sm:h-20 lg:h-24 shrink-0';

export function desktopNavItemClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.01em] cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:px-5 md:py-2.5 md:text-[15px] lg:text-base ${
    active
      ? 'bg-white/[0.1] text-white'
      : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
  }`;
}

export function isNavPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
