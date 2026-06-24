import { Injectable, NotFoundException } from '@nestjs/common';

import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  RBAC_PERMISSION_SCOPES,
  type PermissionCode,
  type PermissionEffect,
  type RbacPermissionScopeId,
  type RbacRole,
  type UserEffectivePermissions,
} from '@community-marketplace/types';
import { toIsoString } from '@community-marketplace/utils';

import { DEV_ROLE_IDS } from '../../../common/constants/dev-role-ids';
import { AuthorizationService } from '../../../common/authorization/authorization.service';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { PERMISSION_SEED, ROLE_SEED } from '../../../database/rbac-seed.data';
import { UsersService } from '../../users/users.service';
import { RbacScopePolicy } from './rbac-scope.policy';
import type {
  AssignPermissionOverrideDto,
  AssignUserRoleDto,
  SyncRolePermissionsDto,
} from './dto/rbac-management.dto';

interface StoredRole {
  id: string;
  code: RbacRole;
  name: string;
  description?: string;
  isSystem: boolean;
}

interface StoredPermission {
  id: string;
  code: PermissionCode;
  name: string;
  resource: string;
  action: string;
  isSystem: boolean;
}

interface StoredUserOverride {
  id: string;
  userId: string;
  permissionId: string;
  effect: PermissionEffect;
  reason?: string;
  grantedById?: string;
  expiresAt?: string;
}

@Injectable()
export class RbacManagementService {
  private readonly memoryRoles = new Map<string, StoredRole>();
  private readonly memoryPermissions = new Map<string, StoredPermission>();
  private readonly memoryRolePermissions = new Map<string, Set<string>>();
  private readonly memoryUserOverrides = new Map<string, StoredUserOverride>();
  private memoryInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly scopePolicy: RbacScopePolicy,
    private readonly authorization: AuthorizationService,
  ) {}

  async listRoles(actor: AuthenticatedUser) {
    await this.scopePolicy.assertCanListRbacCatalog(actor);
    const roles = await this.getRoles();
    return roles.map((role) => ({
      ...role,
      permissionCount: (this.memoryRolePermissions.get(role.id)?.size ?? 0) || undefined,
    }));
  }

  async listPermissions(actor: AuthenticatedUser, scopeId?: string) {
    await this.scopePolicy.assertCanListRbacCatalog(actor);
    await this.ensureMemoryStore();

    const permissions = [...this.memoryPermissions.values()];
    const codes = permissions.map((p) => p.code);
    const allowedCodes = await this.scopePolicy.filterPermissionCodesForActor(actor, codes, scopeId);

    return permissions
      .filter((p) => allowedCodes.includes(p.code))
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        resource: p.resource,
        action: p.action,
        isSystem: p.isSystem,
        scope: this.findScopeForCode(p.code),
      }));
  }

  async listScopes(actor: AuthenticatedUser) {
    await this.scopePolicy.assertCanListRbacCatalog(actor);
    const manageable = await this.scopePolicy.getManageableScopeIds(actor);

    return manageable.map((scopeId) => {
      const scope = RBAC_PERMISSION_SCOPES[scopeId];
      return {
        id: scope.id,
        label: scope.label,
        description: scope.description,
        managementPermission: scope.managementPermission,
        permissionCount: scope.permissions.length,
      };
    });
  }

  async getRolePermissions(actor: AuthenticatedUser, roleId: string) {
    await this.scopePolicy.assertCanListRbacCatalog(actor);
    const role = await this.getRoleById(roleId);

    const permissionIds = await this.getPermissionIdsForRole(roleId);
    const permissions = await this.getPermissionsByIds(permissionIds);

    const filtered: StoredPermission[] = [];
    for (const permission of permissions) {
      try {
        await this.scopePolicy.assertCanModifyRolePermissions(actor, role.code, [permission.code]);
        filtered.push(permission);
      } catch {
        if (this.scopePolicy.isSuperAdmin(actor)) filtered.push(permission);
      }
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      permissions: filtered.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        scope: this.findScopeForCode(p.code),
      })),
    };
  }

  async assignUserRole(actor: AuthenticatedUser, dto: AssignUserRoleDto) {
    const role = await this.getRoleById(dto.roleId);
    await this.scopePolicy.assertCanAssignRole(actor, role.code);

    await this.findUserOrThrow(dto.userId);

    await this.persistUserRole(dto.userId, dto.roleId, role.code);

    return {
      userId: dto.userId,
      roleId: dto.roleId,
      roleCode: role.code,
      assignedBy: actor.id,
      reason: dto.reason,
      assignedAt: toIsoString(),
    };
  }

  async removeUserRole(actor: AuthenticatedUser, userId: string, fallbackRoleId?: string) {
    const fallbackRole = await this.getRoleById(fallbackRoleId ?? DEV_ROLE_IDS.BUYER);
    await this.scopePolicy.assertCanAssignRole(actor, fallbackRole.code);

    await this.findUserOrThrow(userId);

    await this.persistUserRole(userId, fallbackRole.id, fallbackRole.code);

    return {
      userId,
      roleId: fallbackRole.id,
      roleCode: fallbackRole.code,
      removedBy: actor.id,
      removedAt: toIsoString(),
    };
  }

  async addRolePermission(actor: AuthenticatedUser, roleId: string, permissionId: string) {
    const role = await this.getRoleById(roleId);
    const permission = await this.getPermissionById(permissionId);

    await this.scopePolicy.assertCanModifyRolePermissions(actor, role.code, [permission.code]);
    await this.persistRolePermissionAdd(roleId, permissionId);

    return {
      roleId,
      permissionId,
      permissionCode: permission.code,
      addedBy: actor.id,
      addedAt: toIsoString(),
    };
  }

  async removeRolePermission(actor: AuthenticatedUser, roleId: string, permissionId: string) {
    const role = await this.getRoleById(roleId);
    const permission = await this.getPermissionById(permissionId);

    await this.scopePolicy.assertCanModifyRolePermissions(actor, role.code, [permission.code]);
    await this.persistRolePermissionRemove(roleId, permissionId);

    return {
      roleId,
      permissionId,
      permissionCode: permission.code,
      removedBy: actor.id,
      removedAt: toIsoString(),
    };
  }

  async syncRolePermissions(actor: AuthenticatedUser, roleId: string, dto: SyncRolePermissionsDto) {
    const role = await this.getRoleById(roleId);
    const permissions = await Promise.all(dto.permissionIds.map((id) => this.getPermissionById(id)));
    const codes = permissions.map((p) => p.code);

    await this.scopePolicy.assertCanModifyRolePermissions(actor, role.code, codes);
    await this.persistRolePermissionSync(roleId, dto.permissionIds);

    return {
      roleId,
      permissionIds: dto.permissionIds,
      syncedBy: actor.id,
      syncedAt: toIsoString(),
    };
  }

  async assignPermissionOverride(actor: AuthenticatedUser, dto: AssignPermissionOverrideDto) {
    const permission = await this.getPermissionById(dto.permissionId);
    await this.scopePolicy.assertCanManagePermission(actor, permission.code);

    await this.findUserOrThrow(dto.userId);

    const override = await this.persistUserOverride({
      userId: dto.userId,
      permissionId: dto.permissionId,
      effect: dto.effect,
      reason: dto.reason,
      grantedById: actor.id,
      expiresAt: dto.expiresAt,
    });

    return override;
  }

  async revokePermissionOverride(actor: AuthenticatedUser, userId: string, permissionId: string) {
    const permission = await this.getPermissionById(permissionId);
    await this.scopePolicy.assertCanManagePermission(actor, permission.code);

    await this.persistUserOverrideRemove(userId, permissionId);

    return {
      userId,
      permissionId,
      permissionCode: permission.code,
      revokedBy: actor.id,
      revokedAt: toIsoString(),
    };
  }

  async getUserEffectivePermissions(userId: string): Promise<UserEffectivePermissions> {
    const user = await this.findUserOrThrow(userId);

    return this.authorization.resolveForUser({
      id: user.id,
      role: user.role,
      primaryRoleId: user.primaryRoleId,
    });
  }

  async listUserPermissionOverrides(actor: AuthenticatedUser, userId: string) {
    await this.findUserOrThrow(userId);
    await this.scopePolicy.assertCanListRbacCatalog(actor);

    const overrides = await this.loadUserPermissionOverrides(userId);
    const filtered = [];

    for (const override of overrides) {
      try {
        await this.scopePolicy.assertCanManagePermission(actor, override.permissionCode);
        filtered.push(override);
      } catch {
        if (this.scopePolicy.isSuperAdmin(actor)) {
          filtered.push(override);
        }
      }
    }

    return filtered;
  }

  // ── Persistence helpers ─────────────────────────────────────────────────────

  private async persistUserRole(userId: string, roleId: string, roleCode: RbacRole) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { primaryRoleId: roleId },
      });
    } catch {
      // in-memory / dev user store
    }
    this.usersService.updatePrimaryRole(userId, roleId, roleCode);
  }

  private async persistRolePermissionAdd(roleId: string, permissionId: string) {
    await this.ensureMemoryStore();
    try {
      await this.prisma.rolePermission.create({
        data: { roleId, permissionId },
      });
    } catch {
      const set = this.memoryRolePermissions.get(roleId) ?? new Set<string>();
      set.add(permissionId);
      this.memoryRolePermissions.set(roleId, set);
    }
  }

  private async persistRolePermissionRemove(roleId: string, permissionId: string) {
    await this.ensureMemoryStore();
    try {
      await this.prisma.rolePermission.delete({
        where: { roleId_permissionId: { roleId, permissionId } },
      });
    } catch {
      this.memoryRolePermissions.get(roleId)?.delete(permissionId);
    }
  }

  private async persistRolePermissionSync(roleId: string, permissionIds: string[]) {
    await this.ensureMemoryStore();
    try {
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        }),
      ]);
    } catch {
      this.memoryRolePermissions.set(roleId, new Set(permissionIds));
    }
  }

  private async persistUserOverride(input: {
    userId: string;
    permissionId: string;
    effect: PermissionEffect;
    reason?: string;
    grantedById: string;
    expiresAt?: string;
  }) {
    await this.ensureMemoryStore();
    const key = `${input.userId}:${input.permissionId}`;

    try {
      const record = await this.prisma.userPermission.upsert({
        where: {
          userId_permissionId: { userId: input.userId, permissionId: input.permissionId },
        },
        create: {
          userId: input.userId,
          permissionId: input.permissionId,
          effect: input.effect,
          reason: input.reason,
          grantedById: input.grantedById,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
        update: {
          effect: input.effect,
          reason: input.reason,
          grantedById: input.grantedById,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
        include: { permission: true },
      });

      return {
        id: record.id,
        userId: record.userId,
        permissionId: record.permissionId,
        permissionCode: record.permission.code as PermissionCode,
        effect: record.effect,
        reason: record.reason ?? undefined,
        grantedBy: record.grantedById ?? undefined,
        expiresAt: record.expiresAt?.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    } catch {
      const record: StoredUserOverride = {
        id: `override-${key}`,
        userId: input.userId,
        permissionId: input.permissionId,
        effect: input.effect,
        reason: input.reason,
        grantedById: input.grantedById,
        expiresAt: input.expiresAt,
      };
      this.memoryUserOverrides.set(key, record);
      const permission = await this.getPermissionById(input.permissionId);
      return {
        id: record.id,
        userId: record.userId,
        permissionId: record.permissionId,
        permissionCode: permission.code,
        effect: record.effect,
        reason: record.reason,
        grantedBy: record.grantedById,
        expiresAt: record.expiresAt,
        createdAt: toIsoString(),
        updatedAt: toIsoString(),
      };
    }
  }

  private async persistUserOverrideRemove(userId: string, permissionId: string) {
    await this.ensureMemoryStore();
    try {
      await this.prisma.userPermission.delete({
        where: { userId_permissionId: { userId, permissionId } },
      });
    } catch {
      this.memoryUserOverrides.delete(`${userId}:${permissionId}`);
    }
  }

  // ── Read helpers ────────────────────────────────────────────────────────────

  private async findUserOrThrow(userId: string) {
    const inMemory = this.usersService.findById(userId);
    if (inMemory) {
      return inMemory;
    }

    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { primaryRole: true },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName ?? undefined,
          primaryRoleId: dbUser.primaryRoleId,
          role: dbUser.primaryRole.code as RbacRole,
          status: dbUser.status,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        };
      }
    } catch {
      // fall through
    }

    throw new NotFoundException(`User ${userId} not found`);
  }

  private async loadUserPermissionOverrides(userId: string) {
    await this.ensureMemoryStore();

    try {
      const rows = await this.prisma.userPermission.findMany({
        where: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { permission: true },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        permissionId: row.permissionId,
        permissionCode: row.permission.code as PermissionCode,
        effect: row.effect as PermissionEffect,
        reason: row.reason ?? undefined,
        grantedBy: row.grantedById ?? undefined,
        expiresAt: row.expiresAt?.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    } catch {
      // fallback to memory store
    }

    const memoryOverrides = [...this.memoryUserOverrides.values()].filter(
      (override) => override.userId === userId,
    );

    return Promise.all(
      memoryOverrides.map(async (override) => {
        const permission = await this.getPermissionById(override.permissionId);
        return {
          id: override.id,
          userId: override.userId,
          permissionId: override.permissionId,
          permissionCode: permission.code,
          effect: override.effect,
          reason: override.reason,
          grantedBy: override.grantedById,
          expiresAt: override.expiresAt,
          createdAt: toIsoString(),
          updatedAt: toIsoString(),
        };
      }),
    );
  }

  private async getRoles(): Promise<StoredRole[]> {
    await this.ensureMemoryStore();
    try {
      const rows = await this.prisma.role.findMany({ orderBy: { code: 'asc' } });
      if (rows.length) {
        return rows.map((r) => ({
          id: r.id,
          code: r.code as RbacRole,
          name: r.name,
          description: r.description ?? undefined,
          isSystem: r.isSystem,
        }));
      }
    } catch {
      // fallback
    }
    return [...this.memoryRoles.values()];
  }

  private async getRoleById(roleId: string): Promise<StoredRole> {
    const roles = await this.getRoles();
    const role = roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);
    return role;
  }

  private async getPermissionById(permissionId: string): Promise<StoredPermission> {
    await this.ensureMemoryStore();
    const fromMemory = this.memoryPermissions.get(permissionId);
    if (fromMemory) return fromMemory;

    try {
      const row = await this.prisma.permission.findUnique({ where: { id: permissionId } });
      if (row) {
        return {
          id: row.id,
          code: row.code as PermissionCode,
          name: row.name,
          resource: row.resource,
          action: row.action,
          isSystem: row.isSystem,
        };
      }
    } catch {
      // fallback
    }

    throw new NotFoundException(`Permission ${permissionId} not found`);
  }

  private async getPermissionsByIds(ids: string[]): Promise<StoredPermission[]> {
    return Promise.all(ids.map((id) => this.getPermissionById(id)));
  }

  private async getPermissionIdsForRole(roleId: string): Promise<string[]> {
    await this.ensureMemoryStore();
    try {
      const rows = await this.prisma.rolePermission.findMany({ where: { roleId } });
      if (rows.length) return rows.map((r) => r.permissionId);
    } catch {
      // fallback
    }
    return [...(this.memoryRolePermissions.get(roleId) ?? [])];
  }

  private findScopeForCode(code: PermissionCode): RbacPermissionScopeId | null {
    for (const scope of Object.values(RBAC_PERMISSION_SCOPES)) {
      if (scope.permissions.includes(code)) return scope.id as RbacPermissionScopeId;
    }
    return null;
  }

  private async ensureMemoryStore() {
    if (this.memoryInitialized) return;

    for (const role of ROLE_SEED) {
      const code = role.code as RbacRole;
      const id = DEV_ROLE_IDS[code];
      this.memoryRoles.set(id, {
        id,
        code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      });

      const permissionCodes = DEFAULT_ROLE_PERMISSIONS[code];
      const permissionIds = permissionCodes.map((permCode) => this.permissionIdForCode(permCode));
      this.memoryRolePermissions.set(id, new Set(permissionIds));
    }

    for (const permission of PERMISSION_SEED) {
      const id = this.permissionIdForCode(permission.code);
      this.memoryPermissions.set(id, {
        id,
        code: permission.code,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
      });
    }

    this.memoryInitialized = true;
  }

  private permissionIdForCode(code: PermissionCode): string {
    return `perm-${code}`;
  }
}
