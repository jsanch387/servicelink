import { FEATURES_FAQS } from '../data/featuresSeoContent';

export function FeaturesPageFaq() {
  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="features-faq-heading">
      <h2
        id="features-faq-heading"
        className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight"
      >
        Frequently asked questions
      </h2>

      <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.08]">
        {FEATURES_FAQS.map((faq, index) => (
          <details
            key={faq.question}
            className="group bg-white/[0.02] open:bg-white/[0.04] transition-colors"
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left font-semibold text-white text-sm sm:text-base [&::-webkit-details-marker]:hidden">
              <span className="pr-2">{faq.question}</span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 text-gray-400 text-lg leading-none transition-transform group-open:rotate-45 group-open:text-white"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
              <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/15 pl-4">
                {faq.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
