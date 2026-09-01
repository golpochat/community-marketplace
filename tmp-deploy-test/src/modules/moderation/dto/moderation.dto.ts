import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReportDto {
  @IsEnum(['listing', 'user', 'message'])
  targetType!: 'listing' | 'user' | 'message';

  @IsString()
  targetId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ResolveReportDto {
  @IsEnum(['resolved', 'dismissed'])
  status!: 'resolved' | 'dismissed';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateBanDto {
  @IsString()
  userId!: string;

  @IsEnum(['temporary', 'permanent'])
  type!: 'temporary' | 'permanent';

  @IsEnum(['platform', 'listing', 'chat'])
  scope!: 'platform' | 'listing' | 'chat';

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class LiftBanDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
