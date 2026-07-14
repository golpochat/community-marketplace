import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
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

export class CreateCustomRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters, numbers, and underscores',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(['blank', 'MEMBER', 'BUYER', 'SELLER', 'ADMIN'])
  template?: 'blank' | 'MEMBER' | 'BUYER' | 'SELLER' | 'ADMIN';
}

export class UpdateCustomRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class SyncRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
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
