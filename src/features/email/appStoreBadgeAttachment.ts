import { readFileSync } from 'node:fs';
import path from 'node:path';

import { APP_STORE_BADGE_CID } from './appDownloadFooter';

/** Inline App Store badge so the footer renders without fetching the site. */
export function loadAppStoreBadgeAttachment() {
  return {
    filename: 'app-store-badge.png',
    content: readFileSync(
      path.join(process.cwd(), 'public', 'store', 'app-store-badge.png')
    ),
    contentType: 'image/png' as const,
    contentId: APP_STORE_BADGE_CID,
  };
}
