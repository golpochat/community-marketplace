import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { RbacRole, UserEffectivePermissions } from '@community-marketplace/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RbacRole;
  primaryRoleId: string;
  /** Populated after RolesPermissionsGuard resolves permissions for the request */
  permissions?: UserEffectivePermissions;
}

/** @deprecated Use AuthenticatedUser */
export type RequestUser = AuthenticatedUser;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
