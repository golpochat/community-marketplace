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
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-center text-h2 text-gray-900">How it works</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {item.step}
            </div>
            <h3 className="mt-4 text-h3 font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-small text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
