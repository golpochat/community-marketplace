'use client';

import { Tabs } from '@/components/shared/tabs';
import type { StoreSection } from '@community-marketplace/types';

interface StoreSectionTabsProps {
  sections: StoreSection[];
  activeSectionId: string;
  onChange: (sectionId: string) => void;
}

export function StoreSectionTabs({ sections, activeSectionId, onChange }: StoreSectionTabsProps) {
  if (sections.length === 0) return null;

  const items = [
    { id: 'all', label: 'All items' },
    ...sections.slice(0, 10).map((section) => ({ id: section.id, label: section.name })),
  ];

  return (
    <Tabs
      items={items}
      activeId={activeSectionId}
      onChange={onChange}
      className="border-gray-200"
    />
  );
}
