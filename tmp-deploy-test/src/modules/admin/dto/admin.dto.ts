import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminActionDto {
  @IsEnum([
    'user_suspend',
    'user_activate',
    'listing_approve',
    'listing_reject',
    'ban_create',
    'ban_lift',
    'report_resolve',
  ])
  action!:
    | 'user_suspend'
    | 'user_activate'
    | 'listing_approve'
    | 'listing_reject'
    | 'ban_create'
    | 'ban_lift'
    | 'report_resolve';

  @IsString()
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SuspendUserDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
