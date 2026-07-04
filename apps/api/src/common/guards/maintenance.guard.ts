import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RbacRole } from '@community-marketplace/types';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PlatformGovernanceService } from '../../modules/platform/platform-governance.service';

const STAFF_ROLES: RbacRole[] = ['ADMIN', 'SUPER_ADMIN'];

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly governance: PlatformGovernanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const maintenanceMode = await this.governance.isMaintenanceMode();
    if (!maintenanceMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const role = request.user?.role;
    if (role && STAFF_ROLES.includes(role)) {
      return true;
    }

    throw new ServiceUnavailableException(
      'The platform is temporarily under maintenance. Please try again later.',
    );
  }
}
