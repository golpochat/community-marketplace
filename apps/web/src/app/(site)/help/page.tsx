export const metadata = { title: 'Help Centre' };

const FAQ = [
  {
    q: 'How do I buy an item?',
    a: 'Browse listings, message the seller to ask questions, then arrange pickup or delivery.',
  },
  {
    q: 'How do I sell on the marketplace?',
    a: 'Register as a seller, complete verification, then create a listing from your seller dashboard.',
  },
  {
    q: 'Is payment secure?',
    a: 'Payments are processed through our secure payment provider. Never send money outside the platform.',
  },
  {
    q: 'How do I report a listing?',
    a: 'Open the listing detail page and use the Report button to flag suspicious content.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Help centre</h1>
      <p className="mt-2 text-muted-foreground">Find answers to common questions about buying and selling.</p>
      <dl className="mt-10 space-y-8">
        {FAQ.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-foreground">{item.q}</dt>
            <dd className="mt-2 text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
