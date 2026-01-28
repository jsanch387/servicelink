import React from 'react';

const testimonials = [
  {
    name: 'Mike Aris',
    business: 'Premium Auto Detail',
    initials: 'MA',
    content:
      'Service Link changed my mobile detailing business. I used to get DMs all day asking "Where are you based?" and "How much?". Now I just point them to my link and the calls start coming in.',
  },
  {
    name: 'Carlos R.',
    business: 'Elite Detailing Co',
    initials: 'CR',
    content:
      'Setting up a website was too much work and expensive. This literally took 3 minutes and looks better than any $2,000 custom job. My booking rate increased by 40% after adding it to my bio.',
  },
  {
    name: 'James T.',
    business: 'Black Label Detailing',
    initials: 'JT',
    content:
      "The verification badge and clean cover photo make me look like a top-tier company. I've noticed customers aren't questioning my prices as much anymore, and I spend way less time answering basic questions.",
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section
      id="testimonials"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white/[0.02]"
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-10 sm:mb-12 md:mb-16 tracking-tight">
          Trusted by 2,000+ Pros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white/5 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/10 text-left ${
                index === 1 ? 'md:translate-y-6' : ''
              }`}
            >
              <p className="text-gray-300 italic mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-orange-400 text-sm sm:text-base">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base">
                    {testimonial.name}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-black">
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
