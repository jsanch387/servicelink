import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { PublicFooter } from '@/components/shared/PublicFooter';

export function MarketingFooter({
  tagline,
  compact,
}: {
  tagline?: string;
  compact?: boolean;
}) {
  return (
    <PublicFooter
      tagline={tagline}
      compact={compact}
      showFindDetailers={isMarketplacePublicEnabled()}
    />
  );
}
