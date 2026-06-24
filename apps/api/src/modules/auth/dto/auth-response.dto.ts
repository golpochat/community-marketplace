import type { User } from '@community-marketplace/types';

export class AuthResponseDto {
  user!: User;
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
}

export class OtpSentResponseDto {
  email!: string;
  expiresInSeconds!: number;
  message!: string;
}

export class EmailActivationResponseDto {
  activated!: boolean;
  email!: string;
}
