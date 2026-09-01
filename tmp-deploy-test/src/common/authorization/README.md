# Authorization (RBAC)

Reusable NestJS authorization layer. Designed for extraction into a dedicated auth/RBAC microservice.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Controllers — @RequireRole / @RequirePermissions     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  RolesPermissionsGuard (global APP_GUARD)               │
│  AuthGuard — JWT → request.user                       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  AuthorizationService (facade)                          │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  PermissionResolverPort (PERMISSION_RESOLVER token)     │
│  └── PrismaPermissionResolverService (default)            │
│      └── HttpPermissionResolverService (future)           │
└───────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  computeEffectivePermissions() — pure domain, no Nest     │
└─────────────────────────────────────────────────────────┘
```

## Usage

```typescript
import { PERMISSIONS } from '@community-marketplace/types';
import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  @Get('users')
  listUsers() { /* ... */ }
}
```

Programmatic checks in services:

```typescript
constructor(private readonly authorization: AuthorizationService) {}

async doAction(user: AuthenticatedUser) {
  const allowed = await this.authorization.userHasAllPermissions(user, [
    PERMISSIONS.BAN_USER,
  ]);
}
```

## Per-user permission overrides

Two `ADMIN` users can differ: `user_permissions` with `GRANT`/`DENY` overrides are merged in `computeEffectivePermissions()` (deny wins over role grants).

## Microservice extraction

1. Implement `PermissionResolverPort` as an HTTP client calling `GET /internal/users/:id/permissions`.
2. Rebind `PERMISSION_RESOLVER` in `CommonModule` to the HTTP implementation.
3. Move `domain/effective-permissions.ts` into a shared package (already uses `@community-marketplace/types` only).
