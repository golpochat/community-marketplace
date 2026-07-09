import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { ActivationTokenPayload, RegistrationAccountType } from '@community-marketplace/types';
import { RegistrationAccountType as PrismaRegistrationAccountType } from '../../../../generated/prisma';

import { hashPassword } from '../../../database/seeds/password-hash';
import { PrismaService } from '../../../database/prisma.service';
import { EmailIdentityService } from './email-identity.service';

export interface ActivationRegistrationData {
  email: string;
  phone: string;
  name: string;
  accountType: RegistrationAccountType;
  sellerKind?: import('@community-marketplace/types').SellerRegistrationKind;
}

@Injectable()
export class EmailActivationService {
  private static readonly ACTIVATION_TTL_SECONDS = 24 * 60 * 60;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailIdentity: EmailIdentityService,
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

  async activate(token: string, password: string) {
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

    const accountType = this.resolveAccountType(payload.accountType, pending.accountType);

    await this.emailIdentity.assertAvailableForPublicRegistration(payload.email);

    const existingPhone = await this.prisma.userProfile.findUnique({
      where: { phone: payload.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const roleCode = accountType === 'seller' ? 'SELLER' : 'BUYER';
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new ServiceUnavailableException(
        'Account roles are not configured on this server. Run RBAC seed before registration.',
      );
    }
    const roleId = role.id;
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        displayName: pending.name,
        passwordHash: hashPassword(password),
        primaryRoleId: roleId,
        status: 'active',
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
        emailVerified: true,
        phoneVerified: true,
        profile: {
          create: {
            phone: payload.phone,
            ...(accountType === 'seller' && pending.sellerKind
              ? this.buildSellerProfileFromKind(pending.name, pending.sellerKind)
              : {}),
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
      email: pending.email,
      phone: pending.phone,
      name: pending.name,
      accountType: this.resolveAccountType(undefined, pending.accountType),
      sellerKind: pending.sellerKind ?? undefined,
    });

    return { email: pending.email, token };
  }

  async stageRegistration(data: ActivationRegistrationData) {
    await this.emailIdentity.assertAvailableForPublicRegistration(data.email);

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
        sellerKind: data.sellerKind ?? null,
        expiresAt,
      },
      update: {
        phone: data.phone,
        name: data.name,
        accountType: data.accountType,
        sellerKind: data.sellerKind ?? null,
        passwordHash: null,
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

  private buildSellerProfileFromKind(
    publicName: string,
    sellerKind: NonNullable<ActivationRegistrationData['sellerKind']>,
  ) {
    const isBusiness = sellerKind === 'sole_trader' || sellerKind === 'limited_company';
    return {
      businessStructure: sellerKind,
      isBusinessAccount: isBusiness,
      ...(isBusiness ? { businessName: publicName } : {}),
    };
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
