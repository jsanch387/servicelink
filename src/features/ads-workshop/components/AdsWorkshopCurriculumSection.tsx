import { WORKSHOP_CURRICULUM_TOPICS } from '../data/workshopSeoContent';

export function AdsWorkshopCurriculumSection() {
  return (
    <section
      className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-white/[0.06]"
      aria-labelledby="workshop-curriculum-heading"
    >
      <h2
        id="workshop-curriculum-heading"
        className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-10 tracking-tight"
      >
        What is covered inside this workshop
      </h2>

      <div className="grid gap-8 sm:grid-cols-2">
        {WORKSHOP_CURRICULUM_TOPICS.map(topic => (
          <article key={topic.id} className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-start gap-1">
              <span className="text-white/70 shrink-0">{topic.number}.</span>
              <span>{topic.title}</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {topic.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
