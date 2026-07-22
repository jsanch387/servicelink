import { LuBaby, LuCoffee, LuPawPrint } from 'react-icons/lu';

const MESS_CALLOUTS = [
  {
    question: 'Spilled coffee?',
    answer: 'Not permanent.',
    icon: LuCoffee,
  },
  {
    question: 'Pet hair everywhere?',
    answer: 'Handled.',
    icon: LuPawPrint,
  },
  {
    question: 'Kids happened?',
    answer: 'No judgment.',
    icon: LuBaby,
  },
] as const;

export function MarketplaceMessCallouts() {
  return (
    <section
      className="border-y border-black/10 bg-[#f2efe8] px-4 py-14 text-zinc-950 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby="marketplace-mess-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-zinc-500">Life happens.</p>
          <h2
            id="marketplace-mess-heading"
            className="mt-2 text-3xl font-black leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl"
          >
            Your car doesn&apos;t have to stay that way.
          </h2>
        </div>

        <div className="mt-10 border-y border-black/15 sm:mt-12 sm:grid sm:grid-cols-3">
          {MESS_CALLOUTS.map(({ question, answer, icon: Icon }, index) => (
            <div
              key={question}
              className={`flex items-center gap-4 py-6 sm:block sm:min-h-56 sm:px-7 sm:py-7 lg:px-9 ${
                index < MESS_CALLOUTS.length - 1
                  ? 'border-b border-black/15 sm:border-b-0 sm:border-r'
                  : ''
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-black text-[#f2efe8] sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 sm:mt-8">
                <h3 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">
                  {question}
                </h3>
                <p className="mt-1 text-sm font-medium text-zinc-500 sm:mt-2 sm:text-base">
                  {answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-7 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
          From everyday accidents to complete interior resets, find a nearby
          detailer ready to make it feel clean again.
        </p>
      </div>
    </section>
  );
}
