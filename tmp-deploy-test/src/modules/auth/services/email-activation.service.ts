import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { ActivationTokenPayload } from '@community-marketplace/types';

import { devRoleIdFor } from '../../../common/constants/dev-role-ids';
import { PrismaService } from '../../../database/prisma.service';

export interface ActivationRegistrationData {
  name: string;
  email: string;
  phone: string;
}

@Injectable()
export class EmailActivationService {
  private static readonly ACTIVATION_TTL_SECONDS = 24 * 60 * 60;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  createActivationToken(data: ActivationRegistrationData): string {
    const payload: Omit<ActivationTokenPayload, 'iat' | 'exp'> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: 'email_activation',
    };

    return this.jwtService.sign(payload, {
      expiresIn: EmailActivationService.ACTIVATION_TTL_SECONDS,
    });
  }

  async activate(token: string) {
    const payload = this.verifyActivationToken(token);

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existingEmail) {
      if (existingEmail.emailVerifiedAt) {
        return {
          userId: existingEmail.id,
          email: existingEmail.email,
          alreadyActivated: true as const,
        };
      }
      throw new ConflictException('Email is already registered');
    }

    const existingPhone = await this.prisma.userProfile.findUnique({
      where: { phone: payload.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const buyerRole = await this.prisma.role.findUnique({ where: { code: 'BUYER' } });
    const roleId = buyerRole?.id ?? devRoleIdFor('BUYER');
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        displayName: payload.name,
        primaryRoleId: roleId,
        status: 'active',
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
        emailVerified: true,
        phoneVerified: true,
        profile: {
          create: {
            phone: payload.phone,
          },
        },
      },
      include: { primaryRole: true },
    });

    await this.clearPendingRegistration(payload.email);

    return {
      userId: user.id,
      email: user.email,
      alreadyActivated: false as const,
      user,
    };
  }

  async resend(email: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new ForbiddenException('No pending registration found for this email');
    }

    const token = this.createActivationToken({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
    });

    return { email: pending.email, token };
  }

  async stageRegistration(data: ActivationRegistrationData) {
    const expiresAt = new Date(
      Date.now() + EmailActivationService.ACTIVATION_TTL_SECONDS * 1000,
    );

    await this.prisma.pendingRegistration.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        expiresAt,
      },
      update: {
        phone: data.phone,
        name: data.name,
        expiresAt,
      },
    });
  }

  async clearPendingRegistration(email: string) {
    await this.prisma.pendingRegistration.deleteMany({ where: { email } });
  }

  getActivationExpiresIn(): number {
    return EmailActivationService.ACTIVATION_TTL_SECONDS;
  }

  private verifyActivationToken(token: string): ActivationTokenPayload {
    try {
      const payload = this.jwtService.verify<ActivationTokenPayload>(token);
      if (payload.type !== 'email_activation') {
        throw new UnauthorizedException('Invalid activation token');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired activation token');
    }
  }
}

export function buildActivationUrl(appBaseUrl: string, token: string): string {
  const base = appBaseUrl.replace(/\/$/, '');
  return `${base}/auth/activate?token=${encodeURIComponent(token)}`;
}
