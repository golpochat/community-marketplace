import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { PermissionCode, RbacRole, UserEffectivePermissions } from '@community-marketplace/types';

import { AuthorizationService } from '../authorization/authorization.service';
import { hasAllPermissions, hasAnyPermission, hasAnyRole } from '../authorization/domain/effective-permissions';
import {
  REQUIRED_ANY_PERMISSIONS_KEY,
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
} from '../decorators/rbac.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

interface AuthorizedRequest {
  user?: AuthenticatedUser;
  effectivePermissions?: UserEffectivePermissions;
}

/**
 * Global RBAC guard. For authenticated requests, resolves effective permissions by:
 * 1. Loading default permissions for the user's primary role (`role_permissions`)
 * 2. Applying per-user overrides (`user_permissions` GRANT / DENY)
 * 3. Caching the result on the request and `request.user.permissions`
 *
 * Enforces `@RequireRole`, `@RequirePermissions`, and `@RequireAnyPermission` metadata.
 */
@Injectable()
export class RolesPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<RbacRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredAnyPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const hasRbacRequirements =
      Boolean(requiredRoles?.length) ||
      Boolean(requiredPermissions?.length) ||
      Boolean(requiredAnyPermissions?.length);

    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const user = request.user;

    if (hasRbacRequirements && !user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Resolve role permissions + user overrides once per request for authenticated users.
    const resolved = user ? await this.resolveEffectivePermissions(request, user) : undefined;

    if (requiredRoles?.length && user && !hasAnyRole(user.role, requiredRoles)) {
      throw new ForbiddenException('Insufficient role');
    }

    if (requiredPermissions?.length) {
      if (!resolved || !hasAllPermissions(resolved.effective, requiredPermissions)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    if (requiredAnyPermissions?.length) {
      if (!resolved || !hasAnyPermission(resolved.effective, requiredAnyPermissions)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }

  private async resolveEffectivePermissions(
    request: AuthorizedRequest,
    user: AuthenticatedUser,
  ): Promise<UserEffectivePermissions> {
    if (request.effectivePermissions) {
      return request.effectivePermissions;
    }

    const resolved = await this.authorizationService.resolveForUser(user);
    request.effectivePermissions = resolved;
    user.permissions = resolved;
    return resolved;
  }
}
