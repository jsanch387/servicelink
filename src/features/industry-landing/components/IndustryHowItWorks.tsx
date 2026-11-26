import type { IndustryLandingContent } from '../types';
import {
  BookPayVisual,
  ShareLinkVisual,
  ShowUpVisual,
} from './visuals/HowItWorksVisuals';

const VISUALS = [ShareLinkVisual, BookPayVisual, ShowUpVisual] as const;

export function IndustryHowItWorks({
  content,
}: {
  content: IndustryLandingContent;
}) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {content.howItWorks.heading}
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {content.howItWorks.steps.map((step, index) => {
            const Visual = VISUALS[index] ?? ShareLinkVisual;
            return (
              <li key={step.id} className="text-center sm:text-left">
                <Visual />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{step.line}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
