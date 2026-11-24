import { readFileSync } from 'node:fs';
import path from 'node:path';

import { loadAppStoreBadgeAttachment } from '../appStoreBadgeAttachment';
import { WELCOME_INSTAGRAM_CID } from './welcomeLiveTemplate';

export function loadWelcomeLiveInlineAttachments() {
  return [
    {
      filename: 'instagram.png',
      content: readFileSync(
        path.join(process.cwd(), 'public', 'email', 'instagram.png')
      ),
      contentType: 'image/png' as const,
      contentId: WELCOME_INSTAGRAM_CID,
    },
    loadAppStoreBadgeAttachment(),
  ];
}
