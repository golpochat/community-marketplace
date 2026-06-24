import type { ModerationAnalytics, ModerationAppeal, ModerationReportDetail } from '@community-marketplace/types';

import { ModerationDashboard } from '@/components/moderation/moderation-dashboard';
import { requireAdminPermission } from '@/lib/server-rbac';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Moderation' };

export default async function ModerationPage() {
  await requireAdminPermission('moderation');

  const [reports, appeals, bans, analytics] = await Promise.all([
    adminServerService.getModerationReports() as Promise<{
      data: ModerationReportDetail[];
      meta: { total: number };
    }>,
    adminServerService.getModerationAppeals() as Promise<{
      data: ModerationAppeal[];
      meta: { total: number };
    }>,
    adminServerService.getModerationBans(),
    adminServerService.getModerationAnalytics().catch(() => null),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review reports, manage appeals, and view moderation analytics
      </p>
      <div className="mt-8">
        <ModerationDashboard
          initialReports={reports ?? { data: [], meta: { total: 0 } }}
          initialAppeals={appeals ?? { data: [], meta: { total: 0 } }}
          initialBans={Array.isArray(bans) ? bans : []}
          initialAnalytics={analytics as ModerationAnalytics | null}
        />
      </div>
    </div>
  );
}
