import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

interface ContentPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ContentPageShell({ title, subtitle, children }: ContentPageShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
      <div className="mt-8 max-w-none space-y-4 leading-relaxed text-muted-foreground [&_a]:text-primary [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground">{children}</div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/listings">
          <Button>Browse listings</Button>
        </Link>
        <Link href="/safety">
          <Button variant="outline">Safety tips</Button>
        </Link>
      </div>
    </div>
  );
}
