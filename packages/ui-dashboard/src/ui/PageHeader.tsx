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

  if (!description) {
    return null;
  }

  return (
    <p className="mb-6 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
  );
}
