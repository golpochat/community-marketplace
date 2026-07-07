import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PERMISSIONS,
  PRIVILEGED_PERMISSION_CODES,
  RBAC_PERMISSION_SCOPES,
  RBAC_ROLES,
  isPrivilegedSystemRole,
  isSystemRoleCode,
  type PermissionCode,
  type PermissionEffect,
  type RbacPermissionScopeId,
  type RbacRole,
  type RbacRoleTemplateId,
  type UserEffectivePermissions,
} from '@community-marketplace/types';
import { toIsoString } from '@community-marketplace/utils';

import { DEV_ROLE_IDS, devRoleIdForCode } from '../../../common/constants/dev-role-ids';
import {
  assertBootstrapSuperAdminImmutable,
  assertSuperAdminRoleNotAssignable,
} from '../../../common/constants/bootstrap-users';
import { AuthorizationService } from '../../../common/authorization/authorization.service';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { PERMISSION_SEED, PERSONA_ROLE_PERMISSION_SEED, ROLE_PERMISSION_SEED, ROLE_SEED } from '../../../database/rbac-seed.data';
import { UsersService } from '../../users/users.service';
import { RbacScopePolicy } from './rbac-scope.policy';
import type {
  AssignPermissionOverrideDto,
  AssignUserRoleDto,
  CreateCustomRoleDto,
  SyncRolePermissionsDto,
  UpdateCustomRoleDto,
} from './dto/rbac-management.dto';

interface StoredRole {
  id: string;
  code: string;
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
    const userCounts = await this.getRoleUserCounts(roles.map((r) => r.id));

    return roles.map((role) => ({
      ...role,
      userCount: userCounts.get(role.id) ?? 0,
      permissionCount: undefined as number | undefined,
    }));
  }

  async createRole(actor: AuthenticatedUser, dto: CreateCustomRoleDto) {
    if (!this.scopePolicy.isSuperAdmin(actor)) {
      throw new ForbiddenException('Only SUPER_ADMIN can create custom roles');
    }
    const effective = await this.scopePolicy.getActorEffectivePermissions(actor);
    if (!effective.includes(PERMISSIONS.MANAGE_ROLES)) {
      throw new ForbiddenException('MANAGE_ROLES permission required');
    }

    const code = dto.code ?? slugifyRoleCode(dto.name);
    if (isSystemRoleCode(code)) {
      throw new BadRequestException(
        `Role code "${code}" is reserved for a system role. Choose a different code.`,
      );
    }

    await this.ensureMemoryStore();
    const existing = (await this.getRoles()).find((r) => r.code === code);
    if (existing) {
      throw new ConflictException(`Role code "${code}" already exists`);
    }

    const templatePermissionIds = await this.resolveTemplatePermissionIds(
      dto.template ?? 'blank',
    );
    let role: StoredRole;

    try {
      const created = await this.prisma.role.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isSystem: false,
        },
      });
      role = {
        id: created.id,
        code: created.code,
        name: created.name,
        description: created.description ?? undefined,
        isSystem: created.isSystem,
      };
      if (templatePermissionIds.length) {
        await this.prisma.rolePermission.createMany({
          data: templatePermissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    } catch {
      role = {
        id: `role-${code.toLowerCase()}`,
        code,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        isSystem: false,
      };
      this.memoryRoles.set(role.id, role);
      this.memoryRolePermissions.set(role.id, new Set(templatePermissionIds));
    }

    return {
      ...role,
      template: dto.template,
      permissionCount: templatePermissionIds.length,
      createdBy: actor.id,
      createdAt: toIsoString(),
    };
  }

  async updateRole(actor: AuthenticatedUser, roleId: string, dto: UpdateCustomRoleDto) {
    const role = await this.getRoleById(roleId);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be renamed');
    }
    if (!this.scopePolicy.isSuperAdmin(actor)) {
      throw new ForbiddenException('Only SUPER_ADMIN can update custom roles');
    }
    const effective = await this.scopePolicy.getActorEffectivePermissions(actor);
    if (!effective.includes(PERMISSIONS.MANAGE_ROLES)) {
      throw new ForbiddenException('MANAGE_ROLES permission required');
    }

    try {
      const updated = await this.prisma.role.update({
        where: { id: roleId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
        },
      });
      const stored: StoredRole = {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description ?? undefined,
        isSystem: updated.isSystem,
      };
      this.memoryRoles.set(stored.id, stored);
      return { ...stored, updatedBy: actor.id, updatedAt: toIsoString() };
    } catch {
      const stored = this.memoryRoles.get(roleId);
      if (!stored) throw new NotFoundException(`Role ${roleId} not found`);
      if (dto.name !== undefined) stored.name = dto.name.trim();
      if (dto.description !== undefined) stored.description = dto.description.trim();
      this.memoryRoles.set(roleId, stored);
      return { ...stored, updatedBy: actor.id, updatedAt: toIsoString() };
    }
  }

  async deleteRole(actor: AuthenticatedUser, roleId: string) {
    const role = await this.getRoleById(roleId);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    if (!this.scopePolicy.isSuperAdmin(actor)) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete custom roles');
    }
    const effective = await this.scopePolicy.getActorEffectivePermissions(actor);
    if (!effective.includes(PERMISSIONS.MANAGE_ROLES)) {
      throw new ForbiddenException('MANAGE_ROLES permission required');
    }

    const userCounts = await this.getRoleUserCounts([roleId]);
    if ((userCounts.get(roleId) ?? 0) > 0) {
      throw new ConflictException(
        'Cannot delete a role that is assigned to users. Reassign users first.',
      );
    }

    try {
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        this.prisma.role.delete({ where: { id: roleId } }),
      ]);
    } catch {
      this.memoryRolePermissions.delete(roleId);
      this.memoryRoles.delete(roleId);
    }

    return {
      roleId,
      roleCode: role.code,
      deletedBy: actor.id,
      deletedAt: toIsoString(),
    };
  }

  async listPermissions(actor: AuthenticatedUser, scopeId?: string) {
    await this.scopePolicy.assertCanListRbacCatalog(actor);

    const permissions = await this.getPermissionsCatalog();
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
    assertSuperAdminRoleNotAssignable(role.code);
    assertBootstrapSuperAdminImmutable(dto.userId);
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
    assertBootstrapSuperAdminImmutable(userId);
    const fallbackRole = await this.getRoleById(fallbackRoleId ?? DEV_ROLE_IDS.BUYER);
    assertSuperAdminRoleNotAssignable(fallbackRole.code);
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
    const permissionIds = await this.resolvePermissionIdsForPersist(permissions);

    await this.scopePolicy.assertCanModifyRolePermissions(actor, role.code, codes);
    await this.persistRolePermissionSync(roleId, permissionIds);

    return {
      roleId,
      permissionIds,
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

  private async persistUserRole(userId: string, roleId: string, _roleCode: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { primaryRoleId: roleId },
    });
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
    const user = await this.usersService.findById(userId);
    if (user) {
      return user;
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
          emailVerified: Boolean(dbUser.emailVerifiedAt),
          phoneVerified: Boolean(dbUser.phoneVerifiedAt),
          profileCompleted: dbUser.profileCompleted,
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
          code: r.code,
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

  private async getRoleByCode(code: string): Promise<StoredRole> {
    const roles = await this.getRoles();
    const role = roles.find((r) => r.code === code);
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    return role;
  }

  private async resolveTemplatePermissionIds(template: RbacRoleTemplateId): Promise<string[]> {
    if (template === 'blank') return [];

    const templateRole = await this.getRoleByCode(template);
    const permissionIds = await this.getPermissionIdsForRole(templateRole.id);
    if (template !== 'ADMIN') return permissionIds;

    const permissions = await this.getPermissionsByIds(permissionIds);
    return permissions
      .filter((p) => !PRIVILEGED_PERMISSION_CODES.includes(p.code))
      .map((p) => p.id);
  }

  private async getRoleUserCounts(roleIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!roleIds.length) return counts;

    try {
      const rows = await this.prisma.user.groupBy({
        by: ['primaryRoleId'],
        where: { primaryRoleId: { in: roleIds } },
        _count: { _all: true },
      });
      for (const row of rows) {
        counts.set(row.primaryRoleId, row._count._all);
      }
    } catch {
      // memory mode — no user counts
    }
    return counts;
  }

  private async getRoleById(roleId: string): Promise<StoredRole> {
    const roles = await this.getRoles();
    const role = roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);
    return role;
  }

  private async getPermissionById(permissionId: string): Promise<StoredPermission> {
    const resolved = await this.resolvePermissionRecord(permissionId);
    if (resolved) return resolved;

    throw new NotFoundException(`Permission ${permissionId} not found`);
  }

  private async resolvePermissionRecord(permissionId: string): Promise<StoredPermission | null> {
    const codeFromLegacyId = permissionId.startsWith('perm-')
      ? (permissionId.slice(5) as PermissionCode)
      : null;

    try {
      if (codeFromLegacyId) {
        const byCode = await this.prisma.permission.findUnique({ where: { code: codeFromLegacyId } });
        if (byCode) return this.mapPrismaPermission(byCode);
      }

      const byId = await this.prisma.permission.findUnique({ where: { id: permissionId } });
      if (byId) return this.mapPrismaPermission(byId);
    } catch {
      // fallback to memory store below
    }

    await this.ensureMemoryStore();
    const fromMemory = this.memoryPermissions.get(permissionId);
    if (!fromMemory) return null;

    if (fromMemory.id.startsWith('perm-')) {
      try {
        const byCode = await this.prisma.permission.findUnique({ where: { code: fromMemory.code } });
        if (byCode) return this.mapPrismaPermission(byCode);
      } catch {
        // use memory
      }
    }

    return fromMemory;
  }

  private async getPermissionsCatalog(): Promise<StoredPermission[]> {
    try {
      const rows = await this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
      if (rows.length) {
        return rows.map((row) => this.mapPrismaPermission(row));
      }
    } catch {
      // fallback
    }

    await this.ensureMemoryStore();
    const seen = new Set<string>();
    const catalog: StoredPermission[] = [];
    for (const permission of this.memoryPermissions.values()) {
      if (seen.has(permission.code)) continue;
      seen.add(permission.code);
      catalog.push(permission);
    }
    return catalog.sort((a, b) => a.code.localeCompare(b.code));
  }

  private mapPrismaPermission(row: {
    id: string;
    code: string;
    name: string;
    resource: string;
    action: string;
    isSystem: boolean;
  }): StoredPermission {
    return {
      id: row.id,
      code: row.code as PermissionCode,
      name: row.name,
      resource: row.resource,
      action: row.action,
      isSystem: row.isSystem,
    };
  }

  private async resolvePermissionIdsForPersist(permissions: StoredPermission[]): Promise<string[]> {
    const ids: string[] = [];

    for (const permission of permissions) {
      if (!permission.id.startsWith('perm-')) {
        ids.push(permission.id);
        continue;
      }

      try {
        const row = await this.prisma.permission.findUnique({ where: { code: permission.code } });
        if (row) {
          ids.push(row.id);
          continue;
        }
      } catch {
        // memory fallback
      }

      ids.push(permission.id);
    }

    return ids;
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

    const memoryPermissionSeed: Readonly<Record<string, readonly PermissionCode[]>> = {
      ...ROLE_PERMISSION_SEED,
      ...PERSONA_ROLE_PERMISSION_SEED,
    };

    for (const role of ROLE_SEED) {
      const code = role.code;
      const id = devRoleIdForCode(code);
      if (!id) continue;

      this.memoryRoles.set(id, {
        id,
        code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      });

      const permissionCodes = memoryPermissionSeed[code] ?? [];
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

function slugifyRoleCode(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug) {
    throw new BadRequestException('Role name must contain letters or numbers');
  }
  return slug.slice(0, 64);
}
