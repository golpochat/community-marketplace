const TRUST_ITEMS = [
  { icon: '🛡️', title: 'Verified sellers', description: 'Identity-checked sellers with trust badges.' },
  { icon: '💬', title: 'Secure messaging', description: 'Chat safely without sharing personal contact details.' },
  { icon: '📍', title: 'Local community', description: 'Trade with neighbours in your area.' },
  { icon: '⭐', title: 'Reviews & ratings', description: 'See seller feedback before you buy.' },
];

export function TrustSection() {
  return (
    <section className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-h2 text-gray-900">Why trust us</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-100 p-6 text-center">
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
