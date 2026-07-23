'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Category } from '@community-marketplace/types';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { useAdminServiceRole } from '@/hooks/use-admin-service-role';
import { adminService } from '@/services/admin.service';

function FlagToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[hsl(var(--dashboard-main-fg))]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[hsl(var(--dashboard-sidebar-border))]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function AdminCategoriesPage() {
  const role = useAdminServiceRole();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listCategories(role);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchFlags(
    categoryId: string,
    flags: { requiresReview?: boolean; isHidden?: boolean; isActive?: boolean },
  ) {
    setSavingId(categoryId);
    setError(null);
    try {
      const updated = await adminService.updateCategoryFlags(role, categoryId, flags);
      setRows((prev) => prev.map((row) => (row.id === categoryId ? updated : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      await load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <DashboardPageShell
      title="Categories"
      description="Mark restricted categories for review, or hide legacy/prohibited categories from public pickers and search."
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading categories…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No categories found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-xs uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
              {rows.map((row) => {
                const busy = savingId === row.id;
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-[hsl(var(--dashboard-main-fg))]">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {row.slug}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-4">
                        <FlagToggle
                          label="Requires review"
                          checked={row.requiresReview}
                          disabled={busy}
                          onChange={(next) =>
                            void patchFlags(row.id, { requiresReview: next })
                          }
                        />
                        <FlagToggle
                          label="Hidden"
                          checked={row.isHidden}
                          disabled={busy}
                          onChange={(next) => void patchFlags(row.id, { isHidden: next })}
                        />
                        <FlagToggle
                          label="Active"
                          checked={row.isActive}
                          disabled={busy}
                          onChange={(next) => void patchFlags(row.id, { isActive: next })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPageShell>
  );
}
