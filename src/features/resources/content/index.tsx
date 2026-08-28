import React from 'react';
import { BestBookingAppForMobileDetailersContent } from './BestBookingAppForMobileDetailers';
import { HowMobileDetailersGetClientsInstagramContent } from './HowMobileDetailersGetClientsInstagram';
import { HowMuchToChargeForMobileDetailingContent } from './HowMuchToChargeForMobileDetailing';
import { HowToStartMobileDetailingBusinessContent } from './HowToStartMobileDetailingBusiness';
import { ServiceLinkVsDetailConnectVsDetailerMadeContent } from './ServiceLinkVsDetailConnectVsDetailerMade';
import { ServiceLinkVsUrableContent } from './ServiceLinkVsUrable';
import { StopNoShowsDepositsMobileDetailingContent } from './StopNoShowsDepositsMobileDetailing';

/** Map of guide slug to content component. Add new guides here. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const GUIDE_CONTENT: Record<string, React.ComponentType<{}>> = {
  'servicelink-vs-urable-2026': ServiceLinkVsUrableContent,
  'how-much-to-charge-for-mobile-detailing-2026':
    HowMuchToChargeForMobileDetailingContent,
  'how-to-start-a-mobile-detailing-business-2026':
    HowToStartMobileDetailingBusinessContent,
  'servicelink-vs-detail-connect-vs-detailermade-2026':
    ServiceLinkVsDetailConnectVsDetailerMadeContent,
  'best-booking-app-for-mobile-detailers':
    BestBookingAppForMobileDetailersContent,
  'stop-no-shows-deposits-mobile-detailing':
    StopNoShowsDepositsMobileDetailingContent,
  'how-mobile-detailers-get-clients-from-instagram-2026':
    HowMobileDetailersGetClientsInstagramContent,
};

export function getGuideContentComponent(
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): React.ComponentType<{}> | null {
  return GUIDE_CONTENT[slug] ?? null;
}
