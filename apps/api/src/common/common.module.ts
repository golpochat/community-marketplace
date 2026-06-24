import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AuthorizationService } from './authorization/authorization.service';
import { PERMISSION_RESOLVER } from './authorization/ports/permission-resolver.port';
import { PrismaPermissionResolverService } from './authorization/services/prisma-permission-resolver.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesPermissionsGuard } from './guards/roles-permissions.guard';

@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    AuthorizationService,
    PrismaPermissionResolverService,
    {
      provide: PERMISSION_RESOLVER,
      useExisting: PrismaPermissionResolverService,
    },
    AuthGuard,
    RolesPermissionsGuard,
  ],
  exports: [
    AuthorizationService,
    PERMISSION_RESOLVER,
    AuthGuard,
    RolesPermissionsGuard,
  ],
})
export class CommonModule {}
