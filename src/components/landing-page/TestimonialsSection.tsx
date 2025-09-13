import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const testimonials = [
  {
    name: 'Sarah Johnson',
    business: 'Auto Detailing Pro',
    rating: 5,
    comment:
      'BusinessLink transformed how I connect with customers. My bookings increased by 40% in the first month!',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
  },
  {
    name: 'Mike Rodriguez',
    business: 'Lawn Care Express',
    rating: 5,
    comment:
      'Setting up my business profile was incredibly easy. Now customers can see my work and contact me instantly.',
    avatar: 'https://picsum.photos/seed/mike/100/100',
  },
  {
    name: 'Emily Chen',
    business: 'Pet Grooming Studio',
    rating: 5,
    comment:
      'The mobile-first design is perfect for my customers. They love being able to book appointments on their phones.',
    avatar: 'https://picsum.photos/seed/emily/100/100',
  },
  {
    name: 'David Thompson',
    business: 'Barber Shop Elite',
    rating: 5,
    comment:
      'Professional, reliable, and affordable. BusinessLink gave my barbershop the online presence it needed.',
    avatar: 'https://picsum.photos/seed/david/100/100',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Trusted by
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Business Owners
            </span>
            Everywhere
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See what our customers are saying about how BusinessLink has helped
            grow their businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-all duration-300 hover:shadow-lg"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                &ldquo;{testimonial.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-white font-semibold text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {testimonial.business}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
