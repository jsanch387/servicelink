import { GUIDES } from '../data/guides';
import { RESOURCES_INTRO_PARAGRAPHS } from '../data/resourcesSeoContent';
import { ResourcesFeaturedGuide } from './ResourcesFeaturedGuide';
import { ResourcesFaqList } from './ResourcesFaqList';
import { ResourcesHero } from './ResourcesHero';
import { ResourcesSignupCta } from './ResourcesSignupCta';
import { ResourcesTopicGrid } from './ResourcesTopicGrid';

export function ResourcesIndexScreen() {
  const featuredGuide = GUIDES[0];

  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 pb-14 sm:pb-20">
      <ResourcesHero />

      <section
        className="mb-10 sm:mb-12 space-y-4 max-w-2xl"
        aria-labelledby="resources-intro-heading"
      >
        <h2 id="resources-intro-heading" className="sr-only">
          About ServiceLink resources
        </h2>
        {RESOURCES_INTRO_PARAGRAPHS.map(paragraph => (
          <p
            key={paragraph.slice(0, 32)}
            className="text-sm sm:text-base text-gray-500 leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </section>

      <ResourcesTopicGrid />

      {featuredGuide ? <ResourcesFeaturedGuide guide={featuredGuide} /> : null}

      <ResourcesSignupCta />

      <ResourcesFaqList />
    </main>
  );
}
