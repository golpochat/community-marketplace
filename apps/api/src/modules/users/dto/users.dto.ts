import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class VerifyIdentityDto {
  @IsUrl()
  documentUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;
}
