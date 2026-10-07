import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  WELCOME_APP_STORE_CID,
  WELCOME_INSTAGRAM_CID,
} from './welcomeLiveTemplate';

const INLINE_IMAGES = [
  {
    contentId: WELCOME_INSTAGRAM_CID,
    filename: 'instagram.png',
    relativePath: path.join('public', 'email', 'instagram.png'),
  },
  {
    contentId: WELCOME_APP_STORE_CID,
    filename: 'app-store-badge.png',
    relativePath: path.join('public', 'store', 'app-store-badge.png'),
  },
] as const;

export function loadWelcomeLiveInlineAttachments() {
  return INLINE_IMAGES.map(image => ({
    filename: image.filename,
    content: readFileSync(path.join(process.cwd(), image.relativePath)),
    contentType: 'image/png',
    contentId: image.contentId,
  }));
}
