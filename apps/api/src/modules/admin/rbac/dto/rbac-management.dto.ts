import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AssignUserRoleDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class SyncRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}

export class AddRolePermissionDto {
  @IsUUID()
  permissionId!: string;
}

export class AssignPermissionOverrideDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  permissionId!: string;

  @IsEnum(['GRANT', 'DENY'])
  effect!: 'GRANT' | 'DENY';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class RemoveUserRoleDto {
  @IsOptional()
  @IsUUID()
  fallbackRoleId?: string;
}
