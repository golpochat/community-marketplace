import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { ActivationTokenPayload, RegistrationAccountType } from '@community-marketplace/types';
import { RegistrationAccountType as PrismaRegistrationAccountType } from '../../../../generated/prisma';

import { devRoleIdFor } from '../../../common/constants/dev-role-ids';
import { hashPassword } from '../../../database/seeds/password-hash';
import { PrismaService } from '../../../database/prisma.service';

export interface ActivationRegistrationData {
  email: string;
  phone: string;
  name: string;
  password: string;
  accountType: RegistrationAccountType;
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
      email: data.email,
      phone: data.phone,
      accountType: data.accountType,
      type: 'email_activation',
    };

    return this.jwtService.sign(payload, {
      expiresIn: EmailActivationService.ACTIVATION_TTL_SECONDS,
    });
  }

  previewActivation(token: string) {
    const payload = this.verifyActivationToken(token);

    return this.prisma.user.findUnique({ where: { email: payload.email } }).then((user) => ({
      email: payload.email,
      accountType: payload.accountType,
      alreadyActivated: Boolean(user?.emailVerifiedAt),
    }));
  }

  async activate(token: string) {
    const payload = this.verifyActivationToken(token);

    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email: payload.email },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new ForbiddenException('Activation link expired. Please register again.');
    }

    if (pending.phone !== payload.phone) {
      throw new UnauthorizedException('Invalid activation token');
    }

    if (!pending.passwordHash) {
      throw new ForbiddenException('Registration data is incomplete. Please register again.');
    }

    const accountType = this.resolveAccountType(payload.accountType, pending.accountType);

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

    const roleCode = accountType === 'seller' ? 'SELLER' : 'BUYER';
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    const roleId = role?.id ?? devRoleIdFor(roleCode);
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        displayName: pending.name,
        passwordHash: pending.passwordHash,
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

    if (!pending || pending.expiresAt < new Date() || !pending.passwordHash) {
      throw new ForbiddenException('No pending registration found for this email');
    }

    const token = this.createActivationToken({
      email: pending.email,
      phone: pending.phone,
      name: pending.name,
      password: '',
      accountType: this.resolveAccountType(undefined, pending.accountType),
    });

    return { email: pending.email, token };
  }

  async stageRegistration(data: ActivationRegistrationData) {
    await this.prisma.pendingRegistration.deleteMany({
      where: {
        OR: [
          { phone: data.phone, expiresAt: { lt: new Date() } },
          { email: data.email, expiresAt: { lt: new Date() } },
        ],
      },
    });

    const expiresAt = new Date(
      Date.now() + EmailActivationService.ACTIVATION_TTL_SECONDS * 1000,
    );

    await this.prisma.pendingRegistration.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        accountType: data.accountType,
        passwordHash: hashPassword(data.password),
        expiresAt,
      },
      update: {
        phone: data.phone,
        name: data.name,
        accountType: data.accountType,
        passwordHash: hashPassword(data.password),
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

  private resolveAccountType(
    tokenValue: RegistrationAccountType | undefined,
    pendingValue: PrismaRegistrationAccountType,
  ): RegistrationAccountType {
    if (tokenValue === 'buyer' || tokenValue === 'seller') {
      return tokenValue;
    }
    return pendingValue;
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
