import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

import type { NotificationType } from '@community-marketplace/types';

export class RegisterDeviceDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsEnum(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';
}

export class SendNotificationDto {
  @IsString()
  userId!: string;

  @IsEnum([
    'listing_sold',
    'listing_created',
    'new_message',
    'message_read',
    'thread_created',
    'payment_received',
    'payment_sent',
    'payment_refunded',
    'listing_approved',
    'verification_approved',
    'verification_rejected',
    'admin_warning',
    'system',
  ])
  type!: NotificationType;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;
}

export class MarkNotificationReadDto {
  @IsString()
  notificationId!: string;
}
