'use client';

import { Tabs } from '@/components/shared/tabs';
import type { StoreSection } from '@community-marketplace/types';

interface StoreSectionTabsProps {
  sections: StoreSection[];
  activeSectionId: string;
  onChange: (sectionId: string) => void;
}

export function StoreSectionTabs({ sections, activeSectionId, onChange }: StoreSectionTabsProps) {
  const items = [
    { id: 'all', label: 'All items' },
    ...sections.slice(0, 10).map((s) => ({ id: s.id, label: s.name })),
  ];

  return <Tabs items={items} activeId={activeSectionId} onChange={onChange} />;
}
