import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import {
  FEATURES_HERO,
  getFeaturesSeoFeatureList,
} from '../data/featuresSeoContent';

export function FeaturesPageSeoContent() {
  const features = getFeaturesSeoFeatureList();

  return (
    <section aria-label="ServiceLink features overview" className="sr-only">
      <h2>ServiceLink mobile detailer booking system features</h2>
      <p>{FEATURES_HERO.seoDescription}</p>
      <ul>
        {features.map(feature => (
          <li key={feature.id}>
            <h3>{feature.name}</h3>
            <p>{feature.description}</p>
          </li>
        ))}
      </ul>
      <p>
        <Link href={ROUTES.PRICING_PAGE}>View ServiceLink pricing</Link> or{' '}
        <Link href={ROUTES.AUTH.SIGNUP}>create your free booking link</Link>.
      </p>
    </section>
  );
}
