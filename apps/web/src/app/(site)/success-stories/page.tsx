import { ContentPageShell } from '@/components/public/content-page-shell';

export const metadata = { title: 'Success Stories' };

const STORIES = [
  {
    quote: 'Sold in 5 minutes — a buyer from Goatstown collected the same evening.',
    area: 'Goatstown',
    tag: 'Quick sale',
  },
  {
    quote: 'Got a free sofa for the kids\' room. Lovely neighbour, zero hassle.',
    area: 'Dundrum',
    tag: 'Free item',
  },
  {
    quote: 'Found a cheap laptop for school. Met at the local café and it was perfect.',
    area: 'Sandyford',
    tag: 'Great deal',
  },
  {
    quote: 'Listed my bike on my lunch break and had three messages by dinner.',
    area: 'Rathmines',
    tag: 'Local reach',
  },
] as const;

export default function SuccessStoriesPage() {
  return (
    <ContentPageShell
      title="Success stories"
      subtitle="Real wins from neighbours buying and selling locally."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {STORIES.map((story) => (
          <figure
            key={story.quote}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-brand-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{story.tag}</p>
            <blockquote className="mt-2 text-gray-800">&ldquo;{story.quote}&rdquo;</blockquote>
            <figcaption className="mt-3 text-sm text-gray-500">{story.area} Community</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-8 text-gray-600">
        Have your own story? Sell or buy locally and help build a safer community marketplace for
        everyone.
      </p>
    </ContentPageShell>
  );
}
