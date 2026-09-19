export { CommonModule } from './common.module';
export { AuthorizationService } from './authorization/authorization.service';
export { PERMISSION_RESOLVER } from './authorization/ports/permission-resolver.port';
export type { PermissionResolverPort } from './authorization/ports/permission-resolver.port';
export { RolesPermissionsGuard } from './guards/roles-permissions.guard';
export {
  Authenticated,
  RequireAnyPermission,
  RequirePermissions,
  RequireRole,
} from './decorators/rbac.decorator';
export { SkipCsrf } from './decorators/skip-csrf.decorator';
export type { AuthenticatedUser } from './decorators/current-user.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export {
  computeEffectivePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
} from './authorization/domain/effective-permissions';
