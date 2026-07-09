import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { PasswordResetTokenPayload } from '@community-marketplace/types';

import { hashPassword } from '../../../database/seeds/password-hash';
import { PrismaService } from '../../../database/prisma.service';
import { assertUserCanAuthenticate } from '../utils/user-auth-status';

@Injectable()
export class PasswordResetService {
  private static readonly RESET_TTL_SECONDS = 60 * 60;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  createResetToken(email: string, userId: string): string {
    const payload: Omit<PasswordResetTokenPayload, 'iat' | 'exp'> = {
      email,
      userId,
      type: 'password_reset',
    };

    return this.jwtService.sign(payload, {
      expiresIn: PasswordResetService.RESET_TTL_SECONDS,
    });
  }

  getResetExpiresIn(): number {
    return PasswordResetService.RESET_TTL_SECONDS;
  }

  previewReset(token: string) {
    try {
      const payload = this.verifyResetToken(token);
      return {
        email: payload.email,
        expired: false,
      };
    } catch {
      return {
        email: '',
        expired: true,
      };
    }
  }

  async resetPassword(token: string, password: string) {
    const payload = this.verifyResetToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: { primaryRole: true },
    });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid password reset token');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email not activated. Complete email activation first.');
    }

    assertUserCanAuthenticate(user.status);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
      include: { primaryRole: true },
    });

    return {
      userId: updated.id,
      email: updated.email,
      user: updated,
    };
  }

  private verifyResetToken(token: string): PasswordResetTokenPayload {
    try {
      const payload = this.jwtService.verify<PasswordResetTokenPayload>(token);
      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid password reset token');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }
}

export function buildPasswordResetUrl(appBaseUrl: string, token: string): string {
  const base = appBaseUrl.replace(/\/$/, '');
  return `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
}
