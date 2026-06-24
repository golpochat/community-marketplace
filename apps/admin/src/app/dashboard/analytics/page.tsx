import { StatCard } from '@/components/dashboard/stat-card';

export const metadata = { title: 'Analytics' };

const METRICS = [
  { label: 'Page Views', value: '12,450' },
  { label: 'New Signups', value: '234' },
  { label: 'Conversion Rate', value: '3.2%' },
  { label: 'Avg. Session', value: '4m 12s' },
];

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-gray-600">Platform performance metrics</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </div>
  );
}
