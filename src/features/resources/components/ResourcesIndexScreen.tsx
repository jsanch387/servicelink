import { ResourcesArticleList } from './ResourcesArticleList';
import { ResourcesBottomCta } from './ResourcesBottomCta';
import { ResourcesBreadcrumb } from './ResourcesBreadcrumb';
import { ResourcesHero } from './ResourcesHero';

export function ResourcesIndexScreen() {
  return (
    <main id="main-content" aria-label="ServiceLink resources and guides">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <ResourcesBreadcrumb />
        <ResourcesHero />
        <ResourcesArticleList />
      </div>
      <ResourcesBottomCta />
    </main>
  );
}
