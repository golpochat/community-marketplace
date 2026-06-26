'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { RBAC_PERMISSION_SCOPES, RBAC_ROLE_TEMPLATES } from '@community-marketplace/types';
import { Button, Input, Label } from '@community-marketplace/ui';
import { Card, IconActionButton, IconActionGroup } from '@community-marketplace/ui-dashboard';

import { DataTable } from '@/components/dashboard/async-resource';
import { Tabs } from '@/components/shared/tabs';
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

function formatUserCount(count: number): string {
  return count === 1 ? '1 user' : `${count} users`;
}

/** Super Admin always has full access; it is not editable via RBAC UI. */
function isImmutableRole(code: string): boolean {
  return code === 'SUPER_ADMIN';
}

function firstManageableRoleId(roleRows: AdminRbacRoleRow[]): string | null {
  return roleRows.find((item) => !isImmutableRole(item.code))?.id ?? null;
}

function RoleTypeBadge({ isSystem }: { isSystem: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isSystem
          ? 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))]'
          : 'bg-[hsl(var(--dashboard-accent)/0.12)] text-[hsl(var(--dashboard-accent))]'
      }`}
    >
      {isSystem ? 'System' : 'Custom'}
    </span>
  );
}

interface RbacRolesPanelProps {
  roles: AdminRbacRoleRow[];
  selectedRoleId: string | null;
  showCreate: boolean;
  creating: boolean;
  newName: string;
  newCode: string;
  newDescription: string;
  newTemplate: CreateAdminRoleInput['template'];
  onToggleCreate: () => void;
  onSelectRole: (roleId: string) => void;
  onCreateRole: () => void;
  onNewNameChange: (value: string) => void;
  onNewCodeChange: (value: string) => void;
  onNewDescriptionChange: (value: string) => void;
  onNewTemplateChange: (value: CreateAdminRoleInput['template']) => void;
}

function RbacRolesPanel({
  roles,
  selectedRoleId,
  showCreate,
  creating,
  newName,
  newCode,
  newDescription,
  newTemplate,
  onToggleCreate,
  onSelectRole,
  onCreateRole,
  onNewNameChange,
  onNewCodeChange,
  onNewDescriptionChange,
  onNewTemplateChange,
}: RbacRolesPanelProps) {
  const customRoleCount = roles.filter((item) => !item.isSystem).length;

  const rows = roles.map((item) => [
    <div key={`${item.id}-name`} className="min-w-[140px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">{item.name}</span>
        {selectedRoleId === item.id ? (
          <span className="rounded-full bg-[hsl(var(--dashboard-accent)/0.12)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--dashboard-accent))]">
            Selected
          </span>
        ) : null}
      </div>
      {item.description ? (
        <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{item.description}</p>
      ) : null}
    </div>,
    <code
      key={`${item.id}-code`}
      className="rounded bg-[hsl(var(--dashboard-sidebar-active)/0.35)] px-1.5 py-0.5 text-xs text-[hsl(var(--dashboard-main-fg))]"
    >
      {item.code}
    </code>,
    <RoleTypeBadge key={`${item.id}-type`} isSystem={item.isSystem} />,
    <span key={`${item.id}-users`} className="text-[hsl(var(--dashboard-sidebar-muted))]">
      {formatUserCount(item.userCount ?? 0)}
    </span>,
    <IconActionGroup key={`${item.id}-actions`}>
      {isImmutableRole(item.code) ? (
        <span className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Full access</span>
      ) : (
        <IconActionButton
          icon="key"
          label="Manage permissions"
          variant="accent"
          onClick={() => onSelectRole(item.id)}
        />
      )}
    </IconActionGroup>,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">All roles</h3>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {roles.length} roles · {customRoleCount} custom
          </p>
        </div>
        <Button
          type="button"
          variant={showCreate ? 'outline' : 'default'}
          className="w-full shrink-0 sm:w-auto"
          onClick={onToggleCreate}
        >
          {showCreate ? 'Cancel' : 'Create custom role'}
        </Button>
      </div>

      {showCreate ? (
        <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] p-4 md:p-6">
          <h4 className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">New custom role</h4>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Start from a template or build permissions from scratch after creation.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="rbac-new-name">Role name</Label>
              <Input
                id="rbac-new-name"
                value={newName}
                onChange={(e) => {
                  onNewNameChange(e.target.value);
                  if (!newCode) onNewCodeChange(slugifyRoleCode(e.target.value));
                }}
                placeholder="Moderation Lead"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rbac-new-code">Code</Label>
              <Input
                id="rbac-new-code"
                value={newCode}
                onChange={(e) => onNewCodeChange(e.target.value.toUpperCase())}
                placeholder="MODERATION_LEAD"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="rbac-new-template">Template</Label>
              <select
                id="rbac-new-template"
                className="mt-1 w-full rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm"
                value={newTemplate}
                onChange={(e) =>
                  onNewTemplateChange(e.target.value as CreateAdminRoleInput['template'])
                }
              >
                {RBAC_ROLE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {RBAC_ROLE_TEMPLATES.find((t) => t.id === newTemplate)?.description}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="rbac-new-description">Description</Label>
              <Input
                id="rbac-new-description"
                value={newDescription}
                onChange={(e) => onNewDescriptionChange(e.target.value)}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={creating} onClick={onCreateRole}>
              {creating ? 'Creating…' : 'Create role'}
            </Button>
            <Button type="button" variant="outline" onClick={onToggleCreate}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <DataTable columns={['Role', 'Code', 'Type', 'Users', 'Actions']} rows={rows} />

      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Select a role to configure its permissions in the Permissions tab.
      </p>
    </div>
  );
}

interface AdminRbacManagerProps {
  role: AdminServiceRole;
}

type RbacMainTab = 'roles' | 'permissions';

const RBAC_MAIN_TABS: Array<{ id: RbacMainTab; label: string }> = [
  { id: 'roles', label: 'Roles' },
  { id: 'permissions', label: 'Permissions' },
];

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
  const [activeMainTab, setActiveMainTab] = useState<RbacMainTab>('roles');
  const [activeScopeTab, setActiveScopeTab] = useState<string>('accounts');

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const manageableRoles = useMemo(
    () => roles.filter((item) => !isImmutableRole(item.code)),
    [roles],
  );
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

  const scopeTabs = useMemo(() => {
    const tabs = (Object.keys(RBAC_PERMISSION_SCOPES) as Array<keyof typeof RBAC_PERMISSION_SCOPES>)
      .filter((scopeId) => (permissionsByScope.groups.get(scopeId) ?? []).length > 0)
      .map((scopeId) => ({
        id: scopeId,
        label: RBAC_PERMISSION_SCOPES[scopeId].label,
      }));
    if (permissionsByScope.unscoped.length > 0) {
      tabs.push({ id: 'other', label: 'Other' });
    }
    return tabs;
  }, [permissionsByScope]);

  useEffect(() => {
    if (!scopeTabs.some((tab) => tab.id === activeScopeTab)) {
      setActiveScopeTab(scopeTabs[0]?.id ?? 'accounts');
    }
  }, [scopeTabs, activeScopeTab]);

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
      setSelectedRoleId((current) => {
        const currentRole = roleRows.find((item) => item.id === current);
        if (currentRole && !isImmutableRole(currentRole.code)) return current;
        return firstManageableRoleId(roleRows);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles and permissions');
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
    if (selectedRoleId && selectedRole && isImmutableRole(selectedRole.code)) {
      setSelectedRoleId(firstManageableRoleId(roles));
    }
  }, [selectedRoleId, selectedRole, roles]);

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
        setActiveMainTab('permissions');
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

  function selectRole(roleId: string) {
    const roleRow = roles.find((item) => item.id === roleId);
    if (roleRow && isImmutableRole(roleRow.code)) return;
    setSelectedRoleId(roleId);
    setActiveMainTab('permissions');
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

      <Card>
        <Tabs
          items={RBAC_MAIN_TABS}
          activeId={activeMainTab}
          onChange={(id) => setActiveMainTab(id as RbacMainTab)}
        />

        <div className="mt-6">
          {activeMainTab === 'roles' && (
            <RbacRolesPanel
              roles={roles}
              selectedRoleId={selectedRoleId}
              showCreate={showCreate}
              creating={creating}
              newName={newName}
              newCode={newCode}
              newDescription={newDescription}
              newTemplate={newTemplate}
              onToggleCreate={() => setShowCreate((v) => !v)}
              onSelectRole={selectRole}
              onCreateRole={handleCreateRole}
              onNewNameChange={setNewName}
              onNewCodeChange={setNewCode}
              onNewDescriptionChange={setNewDescription}
              onNewTemplateChange={setNewTemplate}
            />
          )}

          {activeMainTab === 'permissions' && (
            <div className="space-y-4">
              <p className="rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.25)] px-3 py-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Super Admin is not listed here — that role always has full platform access and cannot be
                restricted. Configure Admin, Seller, Buyer, and custom roles below.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-gray-600" htmlFor="rbac-role-select">
                    Role
                  </label>
                  <select
                    id="rbac-role-select"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={selectedRoleId ?? ''}
                    onChange={(e) => setSelectedRoleId(e.target.value || null)}
                  >
                    <option value="">Select a role…</option>
                    {manageableRoles.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedRole ? (
                  <div className="flex flex-wrap gap-2">
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
              </div>

              {!selectedRole ? (
                <p className="text-sm text-gray-500">
                  Choose a role from the dropdown or switch to the Roles tab.
                </p>
              ) : loadingPerms ? (
                <p className="text-sm text-gray-500">Loading permissions…</p>
              ) : (
                <div className="space-y-4">
                  {selectedRole.isSystem && isPrivilegedRole(selectedRole.code) ? (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      System admin roles can only be changed by a super-admin with manage_roles.
                    </p>
                  ) : null}

                  {scopeTabs.length > 0 && (
                    <Tabs
                      items={scopeTabs}
                      activeId={activeScopeTab}
                      onChange={setActiveScopeTab}
                    />
                  )}

                  {(Object.keys(RBAC_PERMISSION_SCOPES) as Array<keyof typeof RBAC_PERMISSION_SCOPES>).map(
                    (scopeId) => {
                      if (activeScopeTab !== scopeId) return null;
                      const scope = RBAC_PERMISSION_SCOPES[scopeId];
                      const scopePermissions = permissionsByScope.groups.get(scopeId) ?? [];
                      if (!scopePermissions.length) return null;

                      const allChecked = scopePermissions.every((p) => draftCodes.has(p.code));
                      const someChecked =
                        !allChecked && scopePermissions.some((p) => draftCodes.has(p.code));

                      return (
                        <section key={scopeId}>
                          <div className="mb-3 flex items-center justify-between gap-3">
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
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

                  {activeScopeTab === 'other' && permissionsByScope.unscoped.length > 0 ? (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">Other permissions</h3>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function isPrivilegedRole(code: string): boolean {
  return code === 'SUPER_ADMIN' || code === 'ADMIN';
}
