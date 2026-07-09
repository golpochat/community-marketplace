import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

interface ContentPageShellProps {
  title: string;
  subtitle?: string;
  /** When false, pages with their own CTA row should set this to avoid duplicate footer buttons. */
  showFooterActions?: boolean;
  children: React.ReactNode;
}

const proseLinkStyles =
  '[&_p_a]:text-primary [&_li_a]:text-primary [&_h2_a]:text-primary [&_article_a]:text-primary';

export function ContentPageShell({
  title,
  subtitle,
  showFooterActions = true,
  children,
}: ContentPageShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
      <div
        className={`mt-8 max-w-none space-y-4 leading-relaxed text-muted-foreground ${proseLinkStyles} [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground`}
      >
        {children}
      </div>
      {showFooterActions && (
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/listings">Browse listings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/safety">Safety &amp; scam protection</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
