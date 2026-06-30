import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAdminInvitationDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsUUID()
  roleId!: string;
}

export class AdminInvitationTokenDto {
  @IsString()
  token!: string;
}

export class AcceptAdminInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
