import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { PhoneVerificationTokenPayload } from '@community-marketplace/types';

@Injectable()
export class PhoneVerificationService {
  private static readonly TTL_SECONDS = 15 * 60;

  constructor(private readonly jwtService: JwtService) {}

  createToken(phone: string): { token: string; expiresInSeconds: number } {
    const payload: Omit<PhoneVerificationTokenPayload, 'iat' | 'exp'> = {
      phone,
      type: 'phone_verification',
      purpose: 'register',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: PhoneVerificationService.TTL_SECONDS,
    });

    return {
      token,
      expiresInSeconds: PhoneVerificationService.TTL_SECONDS,
    };
  }

  verifyToken(token: string): PhoneVerificationTokenPayload {
    try {
      const payload = this.jwtService.verify<PhoneVerificationTokenPayload>(token);
      if (payload.type !== 'phone_verification' || payload.purpose !== 'register') {
        throw new UnauthorizedException('Invalid phone verification token');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired phone verification token');
    }
  }

  getExpiresInSeconds(): number {
    return PhoneVerificationService.TTL_SECONDS;
  }
}
