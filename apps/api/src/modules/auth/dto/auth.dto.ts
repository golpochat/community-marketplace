import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

import type { RegistrationAccountType } from '@community-marketplace/types';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class SendOtpDto {
  @IsEnum(['email', 'phone'])
  channel!: 'email' | 'phone';

  @ValidateIf((dto: SendOtpDto) => dto.channel === 'email')
  @IsEmail()
  email?: string;

  @ValidateIf((dto: SendOtpDto) => dto.channel === 'phone')
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsEnum(['login', 'register', 'password_reset'])
  purpose!: 'login' | 'register' | 'password_reset';
}

export class VerifyOtpDto {
  @IsEnum(['email', 'phone'])
  channel!: 'email' | 'phone';

  @ValidateIf((dto: VerifyOtpDto) => dto.channel === 'email')
  @IsEmail()
  email?: string;

  @ValidateIf((dto: VerifyOtpDto) => dto.channel === 'phone')
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsString()
  @MinLength(6)
  code!: string;

  @IsEnum(['login', 'register', 'password_reset'])
  purpose!: 'login' | 'register' | 'password_reset';
}

export class ActivateEmailDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

export class ActivationPreviewDto {
  @IsString()
  token!: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ResendActivationDto {
  @IsEmail()
  email!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class CompleteRegistrationDto {
  @IsEnum(['buyer', 'seller'])
  accountType!: RegistrationAccountType;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phoneVerificationToken!: string;
}
