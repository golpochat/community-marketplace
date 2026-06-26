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
    <section className="border-y border-primary/10 bg-primary/5 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-center text-sm text-gray-700">
        <span>
          <strong className="text-gray-900">{stats.memberCount.toLocaleString()}</strong> people in
          your community are already here
        </span>
        <span aria-hidden className="hidden text-gray-300 sm:inline">
          ·
        </span>
        <span>
          <strong className="text-gray-900">{stats.soldToday.toLocaleString()}</strong> items sold
          today
        </span>
        <span aria-hidden className="hidden text-gray-300 sm:inline">
          ·
        </span>
        <span>
          <strong className="text-gray-900">{stats.newListingsToday.toLocaleString()}</strong> new
          listings today
        </span>
      </div>
    </section>
  );
}
