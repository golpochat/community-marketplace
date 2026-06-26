import { ContentPageShell } from '@/components/public/content-page-shell';

export const metadata = { title: 'Community Rules' };

export default function CommunityRulesPage() {
  return (
    <ContentPageShell
      title="Community rules"
      subtitle="Everyone plays a part in keeping this marketplace safe and local."
    >
      <ol className="list-decimal space-y-4 pl-5">
        <li>
          <strong>No scams.</strong> Misleading listings, fake items, and advance-payment fraud are
          banned. Flagged listings are reviewed before going live.
        </li>
        <li>
          <strong>No illegal items.</strong> Weapons, stolen goods, counterfeit products, and
          prohibited items are not allowed.
        </li>
        <li>
          <strong>No abusive behaviour.</strong> Harassment, hate speech, and threats result in
          immediate suspension.
        </li>
        <li>
          <strong>Be honest.</strong> Accurate photos, fair prices, and truthful descriptions help
          everyone.
        </li>
        <li>
          <strong>Stay local.</strong> Prioritise nearby buyers and sellers for safer, faster
          transactions.
        </li>
      </ol>
      <p className="mt-6">
        Violations may lead to listing removal, account suspension, or a permanent ban. Appeals can
        be submitted through your account settings when available.
      </p>
    </ContentPageShell>
  );
}
