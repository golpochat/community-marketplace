import type { StorePolicy } from '@community-marketplace/types';

interface StorePolicySectionProps {
  policies: StorePolicy;
  embedded?: boolean;
}

export function StorePolicySection({ policies, embedded = false }: StorePolicySectionProps) {
  const items = [
    { label: 'Returns', value: policies.returns },
    { label: 'Shipping', value: policies.shipping },
    { label: 'Response time', value: policies.responseTime },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  const content = (
    <dl className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm font-medium text-gray-900">{item.label}</dt>
          <dd className="mt-1 text-sm text-gray-600">{item.value}</dd>
        </div>
      ))}
    </dl>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Store policies</h2>
      <div className="mt-4">{content}</div>
    </div>
  );
}
