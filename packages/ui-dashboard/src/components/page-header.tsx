'use client';

import { useEffect } from 'react';

import { usePageTitle } from '../lib/page-title-context';

export interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
      ) : null}
    </div>
  );
}
