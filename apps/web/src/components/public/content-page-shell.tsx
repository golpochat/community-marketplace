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
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-gray-600">{subtitle}</p>}
      <div className="prose prose-gray mt-8 max-w-none text-gray-700">{children}</div>
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
