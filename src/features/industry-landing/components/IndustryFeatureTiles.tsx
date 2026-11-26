import type { IndustryLandingContent } from '../types';
import {
  AppMiniVisual,
  BookingMiniVisual,
  CrmMiniVisual,
  DepositsMiniVisual,
  SmsMiniVisual,
} from './visuals/FeatureMiniVisuals';

const VISUALS = {
  booking: BookingMiniVisual,
  deposits: DepositsMiniVisual,
  crm: CrmMiniVisual,
  sms: SmsMiniVisual,
  app: AppMiniVisual,
} as const;

export function IndustryFeatureTiles({
  content,
}: {
  content: IndustryLandingContent;
}) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {content.features.heading}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.features.tiles.map(tile => {
            const Visual =
              VISUALS[tile.id as keyof typeof VISUALS] ?? BookingMiniVisual;
            return (
              <li
                key={tile.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <Visual src={tile.screenshotSrc} alt={tile.screenshotAlt} />
                <h3 className="mt-4 text-base font-semibold text-white">
                  {tile.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{tile.line}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
