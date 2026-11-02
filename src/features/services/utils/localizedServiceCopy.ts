import type { PublicBookingFlowLocale } from '@/constants/routes';

type ServiceCopySource = {
  name: string;
  description?: string | null;
  name_es?: string | null;
  description_es?: string | null;
};

/**
 * Customer-facing service copy for the resolved booking language.
 * Spanish falls back to English when that field was left blank.
 */
export function localizedServiceCopy(
  locale: PublicBookingFlowLocale,
  copy: ServiceCopySource
): { name: string; description: string | null } {
  const englishDescription = copy.description?.trim() || null;
  if (locale !== 'es') {
    return { name: copy.name, description: englishDescription };
  }

  const spanishName = copy.name_es?.trim() || '';
  const spanishDescription = copy.description_es?.trim() || '';

  return {
    name: spanishName || copy.name,
    description: spanishDescription || englishDescription,
  };
}
