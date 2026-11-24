import { ROUTES } from '@/constants/routes';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  linkClasses,
  sectionClasses,
} from '../content/guideContentStyles';

type GuideRelatedLinksProps = {
  slugs: readonly string[];
};

export function GuideRelatedLinks({ slugs }: GuideRelatedLinksProps) {
  const guides = slugs
    .map(slug => getGuideBySlug(slug))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide));

  if (!guides.length) return null;

  return (
    <section
      className={sectionClasses}
      aria-labelledby="related-guides-heading"
    >
      <h2 id="related-guides-heading" className={h2Classes}>
        Related guides
      </h2>
      <ul className="space-y-2.5">
        {guides.map(guide => (
          <li key={guide.slug}>
            <Link
              href={ROUTES.RESOURCE_GUIDE(guide.slug)}
              className={linkClasses}
            >
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
