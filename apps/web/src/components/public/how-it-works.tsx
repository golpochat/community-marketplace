const STEPS = [
  {
    step: '1',
    title: 'Browse or search',
    description: 'Find items near you by category, price, or location.',
  },
  {
    step: '2',
    title: 'Message the seller',
    description: 'Ask questions and negotiate directly through secure chat.',
  },
  {
    step: '3',
    title: 'Meet & complete',
    description: 'Arrange pickup or delivery and pay safely when ready.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-section-title">How it works</h2>
        <p className="text-body mt-3">Three simple steps to buy or sell locally on SellNearby.</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="surface-section flex flex-col items-center p-8 text-center transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-brand-sm">
              {item.step}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
