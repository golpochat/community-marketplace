import { IsArray, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class SyncRolePermissionsDto {
  @IsUUID()
  roleId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}

export class CreateAdminDto {
  @IsString()
  email!: string;
}

export class SuperAdminActionDto {
  @IsString()
  action!: string;

  @IsString()
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
