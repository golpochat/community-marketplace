import { ContentPageShell } from '@/components/public/content-page-shell';

export const metadata = { title: 'Safety & Scam Protection' };

export default function SafetyPage() {
  return (
    <ContentPageShell
      title="Safety & scam protection"
      subtitle="Simple rules to buy and sell safely in your local community."
    >
      <h2 className="text-xl font-semibold text-gray-900">Before you meet</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Meet in a public place — a café, Garda station car park, or busy shopping centre.</li>
        <li>Bring a friend when collecting high-value items.</li>
        <li>Inspect the item carefully before paying.</li>
        <li>Avoid advance payments to strangers — pay when you have the item in hand.</li>
        <li>Keep conversations on the platform so we can help if something goes wrong.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Red flags</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Prices that seem too good to be true for phones, cars, or laptops.</li>
        <li>Sellers who refuse to meet in person or show the item.</li>
        <li>Requests for gift cards, crypto, or overseas bank transfers.</li>
        <li>Pressure to decide immediately.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Report suspicious behaviour</h2>
      <p>
        Use the <strong>Report listing</strong> or <strong>Report user</strong> buttons on any listing
        or seller profile. Our moderation team reviews every report. Repeat offenders are removed from
        the marketplace.
      </p>

      <p className="mt-6 text-sm text-gray-500">
        In an emergency, contact An Garda Síochána. This marketplace is a community tool — not a
        payment escrow service.
      </p>
    </ContentPageShell>
  );
}
