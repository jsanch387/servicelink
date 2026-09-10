import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { Navigation } from './Navigation';

/** Server wrapper so marketplace nav links respect `MARKETPLACE_PUBLIC_ENABLED`. */
export function MarketingNavigation() {
  return <Navigation showFindDetailers={isMarketplacePublicEnabled()} />;
}
