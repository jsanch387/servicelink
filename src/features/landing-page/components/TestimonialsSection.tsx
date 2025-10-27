import { StarIcon } from '@heroicons/react/24/solid';
import React from 'react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    business: 'Johnson Cleaning Services',
    content:
      'I was spending $200/month on a website that nobody could find. Now I just share my ServiceLink and customers call me directly. Made $3,000 in the first month!',
    rating: 5,
  },
  {
    name: 'Mike Rodriguez',
    business: 'Rodriguez Landscaping',
    content:
      'My old website was so complicated to update. With ServiceLink, I just upload my work photos and customers can see everything. Bookings increased by 40%.',
    rating: 5,
  },
  {
    name: 'Lisa Chen',
    business: 'Chen Hair Studio',
    content:
      'Perfect for my hair salon! Clients can see my work, read reviews, and book appointments. No more expensive website maintenance.',
    rating: 5,
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
            What Business Owners Are
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              Saying
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Real results from real businesses
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="relative group">
              {/* Frosted Glass Card */}
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 flex flex-col h-full">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                    ))}
                  </div>

                  {/* Content - Flexible height */}
                  <div className="flex-1 flex flex-col">
                    <p className="text-gray-200 leading-relaxed mb-6 text-sm flex-1">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>

                    {/* Author - Fixed at bottom */}
                    <div className="border-t border-white/10 pt-4 mt-auto">
                      <div className="font-semibold text-white text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-orange-400 text-xs">
                        {testimonial.business}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="relative group max-w-2xl mx-auto">
            {/* Frosted Glass Card */}
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10">
                <p className="text-gray-300 mb-4">
                  Ready to join these successful business owners?
                </p>
                <div className="flex items-center justify-center gap-2 text-orange-400">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">
                    Start your free profile today
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
