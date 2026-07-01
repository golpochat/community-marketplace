'use client';

import { useEffect, useState } from 'react';

import { communityService, type CommunityPublicStats } from '@/services/community.service';

export function SocialProofBar() {
  const [stats, setStats] = useState<CommunityPublicStats | null>(null);

  useEffect(() => {
    void communityService.getStats().then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <section className="border-y border-primary/20 bg-primary/[0.07] py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 text-center text-sm font-medium text-foreground">
        <span>
          <strong className="text-lg font-bold text-primary">{stats.memberCount.toLocaleString()}</strong>
          <span className="ml-1.5 text-muted-foreground">community members</span>
        </span>
        <span aria-hidden className="hidden h-4 w-px bg-border sm:inline" />
        <span>
          <strong className="text-lg font-bold text-primary">{stats.soldToday.toLocaleString()}</strong>
          <span className="ml-1.5 text-muted-foreground">sold today</span>
        </span>
        <span aria-hidden className="hidden h-4 w-px bg-border sm:inline" />
        <span>
          <strong className="text-lg font-bold text-primary">
            {stats.newListingsToday.toLocaleString()}
          </strong>
          <span className="ml-1.5 text-muted-foreground">new listings today</span>
        </span>
      </div>
    </section>
  );
}
