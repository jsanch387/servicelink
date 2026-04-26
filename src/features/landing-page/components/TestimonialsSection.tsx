import { GlassCard } from '@/components/shared';
import React from 'react';

const testimonials = [
  {
    name: 'Mike A.',
    business: 'Precision Auto Detailing',
    initials: 'MA',
    content:
      'Just one link in my bio, customers see my services and book. No more back and forth DMs.',
  },
  {
    name: 'Sarah K.',
    business: 'Gloss Boss Detailing',
    initials: 'SK',
    content:
      'Setup took 2 minutes. My clients love how clean it looks. Bookings went up right away.',
  },
  {
    name: 'David M.',
    business: 'Diamond Shine Detail',
    initials: 'DM',
    content:
      'Finally looks professional without paying for a full website. Exactly what I needed.',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section
      id="testimonials"
      className="relative py-12 sm:py-8 px-4 sm:px-6 overflow-hidden border-t border-b border-white/[0.08]"
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent"
        aria-hidden
      />

      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
            Testimonials
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Trusted by service pros
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={index}
              padding="md"
              rounded="rounded-2xl"
              showBlur={false}
              className="h-full min-h-[200px] flex flex-col group hover:border-white/15 transition-colors duration-300 !pt-4 !px-5 sm:!px-6 !pb-5"
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.92h5.45c-.24 1.26-.95 2.33-2.01 3.05l3.24 2.52c1.89-1.74 2.98-4.31 2.98-7.37 0-.72-.06-1.41-.2-2.08H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 21.5c2.7 0 4.97-.89 6.63-2.41l-3.24-2.52c-.9.61-2.05.97-3.39.97-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A9.99 9.99 0 0012 21.5z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M6.39 13.41A5.99 5.99 0 016.08 12c0-.49.11-.97.31-1.41v-2.6H3.04A9.99 9.99 0 002 12c0 1.61.39 3.14 1.04 4.59l3.35-2.6z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12 6.46c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 3.47 14.69 2.5 12 2.5A9.99 9.99 0 003.04 7.99l3.35 2.6C7.18 8.22 9.39 6.46 12 6.46z"
                      />
                    </svg>
                    Google Review
                  </span>
                  <div
                    className="flex gap-px text-amber-400 flex-shrink-0"
                    aria-label="5 star rating"
                  >
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-[15px] sm:text-base leading-[1.6] mb-5 flex-1 min-h-0">
                  {testimonial.content}
                </p>
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.08] flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-semibold text-gray-400 text-sm tracking-tight">
                      {testimonial.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {testimonial.business}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
