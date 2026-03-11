import React from 'react';
import { HowMobileDetailersGetClientsInstagramContent } from './HowMobileDetailersGetClientsInstagram';

/** Map of guide slug to content component. Add new guides here. */
export const GUIDE_CONTENT: Record<
  string,
  React.ComponentType<{}>
> = {
  'how-mobile-detailers-get-clients-from-instagram-2026':
    HowMobileDetailersGetClientsInstagramContent,
};

export function getGuideContentComponent(
  slug: string
): React.ComponentType<{}> | null {
  return GUIDE_CONTENT[slug] ?? null;
}
