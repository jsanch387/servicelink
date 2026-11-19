import React from 'react';
import { BestBookingAppForMobileDetailersContent } from './BestBookingAppForMobileDetailers';
import { BestCrmForMobileDetailersContent } from './BestCrmForMobileDetailers';
import { DetailDeckAlternativeMobileDetailersContent } from './DetailDeckAlternativeMobileDetailers';
import { HowMobileDetailersGetClientsInstagramContent } from './HowMobileDetailersGetClientsInstagram';
import { HowMuchToChargeForMobileDetailingContent } from './HowMuchToChargeForMobileDetailing';
import { HowToGetMoreMobileDetailingClientsContent } from './HowToGetMoreMobileDetailingClients';
import { HowToStartMobileDetailingBusinessContent } from './HowToStartMobileDetailingBusiness';
import { JobberAlternativeMobileDetailersContent } from './JobberAlternativeMobileDetailers';
import { MobileTechRxAlternativeContent } from './MobileTechRxAlternative';
import { ServiceLinkVsDetailConnectVsDetailerMadeContent } from './ServiceLinkVsDetailConnectVsDetailerMade';
import { ServiceLinkVsUrableContent } from './ServiceLinkVsUrable';
import { StopNoShowsDepositsMobileDetailingContent } from './StopNoShowsDepositsMobileDetailing';

/** Map of guide slug to content component. Add new guides here. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const GUIDE_CONTENT: Record<string, React.ComponentType<{}>> = {
  'best-crm-for-mobile-detailers': BestCrmForMobileDetailersContent,
  'mobile-tech-rx-alternative': MobileTechRxAlternativeContent,
  'how-to-get-more-mobile-detailing-clients':
    HowToGetMoreMobileDetailingClientsContent,
  'servicelink-vs-detaildeck': DetailDeckAlternativeMobileDetailersContent,
  'jobber-alternative-mobile-detailers':
    JobberAlternativeMobileDetailersContent,
  'servicelink-vs-urable': ServiceLinkVsUrableContent,
  'how-much-to-charge-for-mobile-detailing':
    HowMuchToChargeForMobileDetailingContent,
  'how-to-start-a-mobile-detailing-business':
    HowToStartMobileDetailingBusinessContent,
  'servicelink-vs-detail-connect-vs-detailermade':
    ServiceLinkVsDetailConnectVsDetailerMadeContent,
  'best-booking-app-for-mobile-detailers':
    BestBookingAppForMobileDetailersContent,
  'stop-no-shows-deposits-mobile-detailing':
    StopNoShowsDepositsMobileDetailingContent,
  'how-mobile-detailers-get-clients-from-instagram':
    HowMobileDetailersGetClientsInstagramContent,
};

export function getGuideContentComponent(
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): React.ComponentType<{}> | null {
  return GUIDE_CONTENT[slug] ?? null;
}
