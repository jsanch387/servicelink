import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { PublicFooter } from '@/components/shared/PublicFooter';

export function MarketingFooter({ compact }: { compact?: boolean }) {
  return (
    <PublicFooter
      compact={compact}
      showFindDetailers={isMarketplacePublicEnabled()}
    />
  );
}
