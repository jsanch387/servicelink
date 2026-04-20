import React from 'react';
import { HowMobileDetailersGetClientsInstagramContent } from './HowMobileDetailersGetClientsInstagram';

/** Map of guide slug to content component. Add new guides here. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const GUIDE_CONTENT: Record<string, React.ComponentType<{}>> = {
  'how-mobile-detailers-get-clients-from-instagram-2026':
    HowMobileDetailersGetClientsInstagramContent,
};

export function getGuideContentComponent(
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): React.ComponentType<{}> | null {
  return GUIDE_CONTENT[slug] ?? null;
}
