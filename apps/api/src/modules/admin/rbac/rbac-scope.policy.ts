import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  PRIVILEGED_PERMISSION_CODES,
  PRIVILEGED_ROLE_CODES,
  PERMISSIONS,
  RBAC_PERMISSION_SCOPES,
  type PermissionCode,
  type RbacPermissionScopeId,
  type RbacRole,
} from '@community-marketplace/types';

import { AuthorizationService } from '../../../common/authorization/authorization.service';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class RbacScopePolicy {
  constructor(private readonly authorization: AuthorizationService) {}

  isSuperAdmin(actor: Pick<AuthenticatedUser, 'role'>): boolean {
    return actor.role === 'SUPER_ADMIN';
  }

  async getActorEffectivePermissions(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<PermissionCode[]> {
    const resolved = await this.authorization.resolveForUser(actor);
    return resolved.effective;
  }

  async getManageableScopeIds(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<RbacPermissionScopeId[]> {
    if (this.isSuperAdmin(actor)) {
      return Object.keys(RBAC_PERMISSION_SCOPES) as RbacPermissionScopeId[];
    }

    const effective = await this.getActorEffectivePermissions(actor);
    const effectiveSet = new Set(effective);

    return (Object.keys(RBAC_PERMISSION_SCOPES) as RbacPermissionScopeId[]).filter((scopeId) =>
      effectiveSet.has(RBAC_PERMISSION_SCOPES[scopeId].managementPermission),
    );
  }

  async assertCanListRbacCatalog(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<void> {
    const allowed = await this.canListRbacCatalog(actor);
    if (!allowed) {
      throw new ForbiddenException('Not allowed to access RBAC catalog');
    }
  }

  async canListRbacCatalog(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<boolean> {
    if (this.isSuperAdmin(actor)) return true;

    const effective = await this.getActorEffectivePermissions(actor);
    const effectiveSet = new Set(effective);

    if (effectiveSet.has(PERMISSIONS.MANAGE_ROLES) || effectiveSet.has(PERMISSIONS.MANAGE_PERMISSIONS)) {
      return true;
    }

    return (Object.values(RBAC_PERMISSION_SCOPES) as (typeof RBAC_PERMISSION_SCOPES)[RbacPermissionScopeId][]).some(
      (scope) => effectiveSet.has(scope.managementPermission),
    );
  }

  isPrivilegedRole(roleCode: RbacRole): boolean {
    return (PRIVILEGED_ROLE_CODES as readonly string[]).includes(roleCode);
  }

  isPrivilegedPermission(code: PermissionCode): boolean {
    return PRIVILEGED_PERMISSION_CODES.includes(code);
  }

  async assertCanAssignRole(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
    targetRoleCode: RbacRole,
  ): Promise<void> {
    if (targetRoleCode === 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN accounts cannot be created or assigned via the API');
    }

    if (targetRoleCode === 'ADMIN') {
      if (!this.isSuperAdmin(actor)) {
        throw new ForbiddenException('Only SUPER_ADMIN can assign admin roles');
      }
      const effective = await this.getActorEffectivePermissions(actor);
      if (!effective.includes(PERMISSIONS.MANAGE_ADMINS)) {
        throw new ForbiddenException('MANAGE_ADMINS permission required');
      }
      return;
    }

    if (this.isSuperAdmin(actor)) return;

    const effective = await this.getActorEffectivePermissions(actor);
    if (!effective.includes(PERMISSIONS.ASSIGN_ROLE)) {
      throw new ForbiddenException('ASSIGN_ROLE permission required');
    }
  }

  async assertCanModifyRolePermissions(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
    targetRoleCode: RbacRole,
    permissionCodes: PermissionCode[],
  ): Promise<void> {
    if (this.isPrivilegedRole(targetRoleCode)) {
      if (!this.isSuperAdmin(actor)) {
        throw new ForbiddenException('Only SUPER_ADMIN can modify privileged role permissions');
      }
      const effective = await this.getActorEffectivePermissions(actor);
      if (!effective.includes(PERMISSIONS.MANAGE_ROLES)) {
        throw new ForbiddenException('MANAGE_ROLES permission required');
      }
      return;
    }

    for (const code of permissionCodes) {
      await this.assertCanManagePermission(actor, code);
    }
  }

  async assertCanManagePermission(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
    permissionCode: PermissionCode,
  ): Promise<void> {
    if (this.isPrivilegedPermission(permissionCode)) {
      if (!this.isSuperAdmin(actor)) {
        throw new ForbiddenException('Only SUPER_ADMIN can manage privileged permissions');
      }
      const effective = await this.getActorEffectivePermissions(actor);
      if (!effective.includes(PERMISSIONS.MANAGE_PERMISSIONS)) {
        throw new ForbiddenException('MANAGE_PERMISSIONS permission required');
      }
      return;
    }

    if (this.isSuperAdmin(actor)) return;

    const manageableScopes = await this.getManageableScopeIds(actor);
    const effective = await this.getActorEffectivePermissions(actor);
    const effectiveSet = new Set(effective);

    if (effectiveSet.has(PERMISSIONS.MANAGE_ROLES) || effectiveSet.has(PERMISSIONS.MANAGE_PERMISSIONS)) {
      return;
    }

    const allowed = manageableScopes.some((scopeId) =>
      RBAC_PERMISSION_SCOPES[scopeId].permissions.includes(permissionCode),
    );

    if (!allowed) {
      throw new ForbiddenException(`Not allowed to manage permission: ${permissionCode}`);
    }
  }

  async filterPermissionCodesForActor(
    actor: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
    codes: PermissionCode[],
    scopeId?: string,
  ): Promise<PermissionCode[]> {
    if (scopeId) {
      const scope = RBAC_PERMISSION_SCOPES[scopeId as RbacPermissionScopeId];
      if (!scope) return [];
      const scoped = codes.filter((code) => scope.permissions.includes(code));
      const filtered: PermissionCode[] = [];
      for (const code of scoped) {
        try {
          await this.assertCanManagePermission(actor, code);
          filtered.push(code);
        } catch {
          // omit unauthorized
        }
      }
      return filtered;
    }

    if (this.isSuperAdmin(actor)) return codes;

    const filtered: PermissionCode[] = [];
    for (const code of codes) {
      try {
        await this.assertCanManagePermission(actor, code);
        filtered.push(code);
      } catch {
        // omit
      }
    }
    return filtered;
  }
}
