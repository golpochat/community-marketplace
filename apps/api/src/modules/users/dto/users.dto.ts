import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class SellerVerificationDto {
  @IsUrl()
  idDocumentFrontUrl!: string;

  @IsUrl()
  idDocumentBackUrl!: string;

  @IsUrl()
  selfieUrl!: string;

  @IsUrl()
  addressProofUrl!: string;
}

export class SuspendUserDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateMarketplaceUserStatusDto {
  @IsEnum(['active', 'inactive'])
  status!: 'active' | 'inactive';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BanUserDto {
  @IsUUID()
  userId!: string;

  @IsEnum(['temporary', 'permanent'])
  type!: 'temporary' | 'permanent';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class VerificationReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
