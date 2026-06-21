import { ResourcesArticleList } from './ResourcesArticleList';
import { ResourcesBreadcrumb } from './ResourcesBreadcrumb';
import { ResourcesHero } from './ResourcesHero';

export function ResourcesIndexScreen() {
  return (
    <main
      id="main-content"
      aria-label="ServiceLink resources and guides"
      className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 pb-14 sm:pb-20"
    >
      <ResourcesBreadcrumb />
      <ResourcesHero />
      <ResourcesArticleList />
    </main>
  );
}
