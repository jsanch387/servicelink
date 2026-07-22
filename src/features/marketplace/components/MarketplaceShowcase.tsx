import { MARKETING_IMAGES } from '@/constants/marketingImages';
import Image from 'next/image';

const SHOWCASES = [
  {
    label: 'Interior detail',
    image: MARKETING_IMAGES.marketplace.interiorOne,
    alt: 'Freshly detailed sports-car interior',
  },
  {
    label: 'Exterior detail',
    image: MARKETING_IMAGES.marketplace.exterior,
    alt: 'Detailed red sports car exterior',
  },
  {
    label: 'Ceramic coating',
    image: MARKETING_IMAGES.marketplace.ceramic,
    alt: 'Ceramic coating applied to a vehicle',
  },
  {
    label: 'Interior detail',
    image: MARKETING_IMAGES.marketplace.interiorTwo,
    alt: 'Freshly detailed luxury-car interior',
  },
  {
    label: 'Boat detail',
    image: MARKETING_IMAGES.marketplace.boat,
    alt: 'Freshly detailed red and black boat',
  },
] as const;

function ShowcaseCard({ showcase }: { showcase: (typeof SHOWCASES)[number] }) {
  return (
    <article className="group w-[286px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-neutral-900 sm:w-[360px]">
      <div className="relative h-56 overflow-hidden bg-neutral-800 sm:h-64">
        <Image
          src={showcase.image}
          alt={showcase.alt}
          fill
          sizes="(min-width: 640px) 360px, 286px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/[0.03]" />
      </div>
      <p className="border-t border-white/[0.08] px-5 py-4 text-sm font-semibold text-gray-200">
        {showcase.label}
      </p>
    </article>
  );
}

export function MarketplaceShowcase() {
  return (
    <section
      className="relative z-0 overflow-hidden pb-10 pt-2 sm:pb-12 sm:pt-4"
      aria-label="Detailing results showcase"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--dashboard-bg)] to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--dashboard-bg)] to-transparent sm:w-28" />

        <div className="animate-marquee-premium motion-reduce:animate-none flex w-max gap-4 px-2 hover:[animation-play-state:paused]">
          {[...SHOWCASES, ...SHOWCASES].map((showcase, index) => (
            <div
              key={`${showcase.label}-${index}`}
              aria-hidden={index >= SHOWCASES.length}
            >
              <ShowcaseCard showcase={showcase} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
