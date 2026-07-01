const TRUST_ITEMS = [
  { icon: '🛡️', title: 'Verified sellers', description: 'Identity-checked sellers with trust badges.' },
  { icon: '💬', title: 'Secure messaging', description: 'Chat safely without sharing personal contact details.' },
  { icon: '📍', title: 'Local community', description: 'Trade with neighbours in your area.' },
  { icon: '⭐', title: 'Reviews & ratings', description: 'See seller feedback before you buy.' },
];

export function TrustSection() {
  return (
    <section className="surface-band border-t border-border/60 py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-section-title">Why trust SellNearby</h2>
          <p className="text-body mt-3">
            Built for Irish communities — safety, transparency, and local trade first.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="surface-section p-6 text-center"
            >
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
