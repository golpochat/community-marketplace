'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { RBAC_PERMISSION_SCOPES, RBAC_ROLE_TEMPLATES } from '@community-marketplace/types';
import { Button, Input } from '@community-marketplace/ui';
import { Card } from '@community-marketplace/ui-dashboard';

import {
  adminService,
  type AdminRbacPermissionRow,
  type AdminRbacRoleRow,
  type AdminServiceRole,
  type CreateAdminRoleInput,
} from '@/services/admin.service';

function slugifyRoleCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

interface AdminRbacManagerProps {
  role: AdminServiceRole;
}

export function AdminRbacManager({ role }: AdminRbacManagerProps) {
  const [roles, setRoles] = useState<AdminRbacRoleRow[]>([]);
  const [permissions, setPermissions] = useState<AdminRbacPermissionRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [assignedCodes, setAssignedCodes] = useState<Set<string>>(new Set());
  const [draftCodes, setDraftCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTemplate, setNewTemplate] = useState<CreateAdminRoleInput['template']>('blank');

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const isDirty = useMemo(() => {
    if (assignedCodes.size !== draftCodes.size) return true;
    for (const code of draftCodes) {
      if (!assignedCodes.has(code)) return true;
    }
    return false;
  }, [assignedCodes, draftCodes]);

  const permissionsByScope = useMemo(() => {
    const groups = new Map<string, AdminRbacPermissionRow[]>();
    const unscoped: AdminRbacPermissionRow[] = [];

    for (const permission of permissions) {
      const scopeId = permission.scope ?? null;
      if (!scopeId) {
        unscoped.push(permission);
        continue;
      }
      const list = groups.get(scopeId) ?? [];
      list.push(permission);
      groups.set(scopeId, list);
    }

    return { groups, unscoped };
  }, [permissions]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleRows, permissionRows] = await Promise.all([
        adminService.listRbacRoles(role),
        adminService.listRbacPermissions(role),
      ]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedRoleId((current) => current ?? roleRows[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RBAC catalog');
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadRolePermissions = useCallback(
    async (roleId: string) => {
      setLoadingPerms(true);
      try {
        const codes = await adminService.getRbacRolePermissions(role, roleId);
        const set = new Set(codes);
        setAssignedCodes(set);
        setDraftCodes(new Set(set));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load role permissions');
      } finally {
        setLoadingPerms(false);
      }
    },
    [role],
  );

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (selectedRoleId) {
      void loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, loadRolePermissions]);

  function togglePermission(code: string) {
    setDraftCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleScope(scopeId: keyof typeof RBAC_PERMISSION_SCOPES, enabled: boolean) {
    const scopeCodes = RBAC_PERMISSION_SCOPES[scopeId].permissions;
    const available = permissions.filter((p) => scopeCodes.includes(p.code as never));
    setDraftCodes((current) => {
      const next = new Set(current);
      for (const permission of available) {
        if (enabled) next.add(permission.code);
        else next.delete(permission.code);
      }
      return next;
    });
  }

  async function handleSavePermissions() {
    if (!selectedRole) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const permissionIds = permissions
        .filter((p) => draftCodes.has(p.code))
        .map((p) => p.id);
      await adminService.syncRbacRolePermissions(role, selectedRole.id, permissionIds);
      setAssignedCodes(new Set(draftCodes));
      setMessage(`Permissions saved for ${selectedRole.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole() {
    if (!newName.trim()) {
      setError('Role name is required');
      return;
    }
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await adminService.createRbacRole(role, {
        name: newName.trim(),
        code: newCode.trim() || undefined,
        description: newDescription.trim() || undefined,
        template: newTemplate ?? 'blank',
      });
      if (created) {
        setRoles((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)));
        setSelectedRoleId(created.id);
        setShowCreate(false);
        setNewName('');
        setNewCode('');
        setNewDescription('');
        setNewTemplate('blank');
        setMessage(`Role "${created.name}" created.`);
      }
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole || selectedRole.isSystem) return;
    if ((selectedRole.userCount ?? 0) > 0) {
      setError('Reassign users before deleting this role.');
      return;
    }
    if (!window.confirm(`Delete custom role "${selectedRole.name}"? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminService.deleteRbacRole(role, selectedRole.id);
      setMessage(`Role "${selectedRole.name}" deleted.`);
      setSelectedRoleId(null);
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading roles and permissions…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card title="Roles">
          <div className="space-y-3">
            <Button type="button" className="w-full" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Cancel' : 'Create custom role'}
            </Button>

            {showCreate ? (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Role name</label>
                  <Input
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newCode) setNewCode(slugifyRoleCode(e.target.value));
                    }}
                    placeholder="Moderation Lead"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Code</label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="MODERATION_LEAD"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Template</label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={newTemplate}
                    onChange={(e) =>
                      setNewTemplate(e.target.value as CreateAdminRoleInput['template'])
                    }
                  >
                    {RBAC_ROLE_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {RBAC_ROLE_TEMPLATES.find((t) => t.id === newTemplate)?.description}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <Button type="button" className="w-full" disabled={creating} onClick={handleCreateRole}>
                  {creating ? 'Creating…' : 'Create role'}
                </Button>
              </div>
            ) : null}

            <ul className="max-h-[420px] space-y-1 overflow-y-auto">
              {roles.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(item.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedRoleId === item.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {item.code}
                      {item.isSystem ? ' · system' : ' · custom'}
                      {(item.userCount ?? 0) > 0 ? ` · ${item.userCount} users` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title={selectedRole ? `Permissions — ${selectedRole.name}` : 'Permissions'}>
          {selectedRole ? (
            <div className="mb-4 flex flex-wrap justify-end gap-2">
              {!selectedRole.isSystem ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleDeleteRole}
                >
                  Delete role
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={!isDirty || saving || loadingPerms}
                onClick={handleSavePermissions}
              >
                {saving ? 'Saving…' : 'Save permissions'}
              </Button>
            </div>
          ) : null}
          {!selectedRole ? (
            <p className="text-sm text-gray-500">Select a role to manage permissions.</p>
          ) : loadingPerms ? (
            <p className="text-sm text-gray-500">Loading permissions…</p>
          ) : (
            <div className="space-y-6">
              {selectedRole.isSystem && isPrivilegedRole(selectedRole.code) ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  System admin roles can only be changed by a super-admin with manage_roles.
                </p>
              ) : null}

              {(Object.keys(RBAC_PERMISSION_SCOPES) as Array<keyof typeof RBAC_PERMISSION_SCOPES>).map(
                (scopeId) => {
                  const scope = RBAC_PERMISSION_SCOPES[scopeId];
                  const scopePermissions = permissionsByScope.groups.get(scopeId) ?? [];
                  if (!scopePermissions.length) return null;

                  const allChecked = scopePermissions.every((p) => draftCodes.has(p.code));
                  const someChecked =
                    !allChecked && scopePermissions.some((p) => draftCodes.has(p.code));

                  return (
                    <section key={scopeId}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{scope.label}</h3>
                          <p className="text-xs text-gray-500">{scope.description}</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => {
                              if (el) el.indeterminate = someChecked;
                            }}
                            onChange={(e) => toggleScope(scopeId, e.target.checked)}
                          />
                          All in scope
                        </label>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {scopePermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={draftCodes.has(permission.code)}
                              onChange={() => togglePermission(permission.code)}
                            />
                            <span>
                              <span className="font-medium text-gray-900">{permission.name}</span>
                              <span className="block text-xs text-gray-500">{permission.code}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  );
                },
              )}

              {permissionsByScope.unscoped.length ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Other permissions</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {permissionsByScope.unscoped.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={draftCodes.has(permission.code)}
                          onChange={() => togglePermission(permission.code)}
                        />
                        <span>
                          <span className="font-medium text-gray-900">{permission.name}</span>
                          <span className="block text-xs text-gray-500">{permission.code}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function isPrivilegedRole(code: string): boolean {
  return code === 'SUPER_ADMIN' || code === 'ADMIN';
}
