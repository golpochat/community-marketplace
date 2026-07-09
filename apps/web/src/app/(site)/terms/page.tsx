import { ContentPageShell } from '@/components/public/content-page-shell';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Terms of Service',
  description: 'Terms and conditions for using SellNearby.ie.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <ContentPageShell title="Terms of service">
      <p>
        By using this marketplace you agree to list only legal items, provide accurate descriptions,
        and treat other members respectfully. We may remove listings or accounts that break our{' '}
        <a href="/community-rules" className="text-primary hover:underline">
          community rules
        </a>
        .
      </p>
      <p className="mt-4">
        The platform connects local buyers and sellers. We do not guarantee transactions, hold
        payments, or provide legal protection beyond moderation and reporting tools.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Full legal terms will be published as the platform grows. Contact us with questions.
      </p>
    </ContentPageShell>
  );
}
