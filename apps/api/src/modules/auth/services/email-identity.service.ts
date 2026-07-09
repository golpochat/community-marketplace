import { ConflictException, Injectable } from '@nestjs/common';

import { isPrivilegedSystemRole } from '@community-marketplace/types';
import { normalizeEmail } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EMAIL_IDENTITY_MESSAGES } from '../constants/email-identity.messages';

type UserWithRole = Awaited<ReturnType<EmailIdentityService['findUserByEmail']>>;

@Injectable()
export class EmailIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  normalize(email: string): string {
    return normalizeEmail(email);
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: this.normalize(email) },
      include: { primaryRole: true },
    });
  }

  async assertAvailableForPublicRegistration(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) return;

    if (isPrivilegedSystemRole(user.primaryRole.code)) {
      throw new ConflictException(EMAIL_IDENTITY_MESSAGES.publicOperatorBlocked);
    }

    throw new ConflictException(EMAIL_IDENTITY_MESSAGES.publicDuplicate);
  }

  async assertAvailableForAdminInvitation(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) return;

    if (isPrivilegedSystemRole(user.primaryRole.code)) {
      throw new ConflictException(EMAIL_IDENTITY_MESSAGES.invitationExistingOperator);
    }

    throw new ConflictException(EMAIL_IDENTITY_MESSAGES.invitationExistingMarketplace);
  }

  async assertInvitationAcceptanceAllowed(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) return;

    throw new ConflictException(EMAIL_IDENTITY_MESSAGES.invitationAcceptBlocked);
  }

  assertProfileEmailAvailable(
    email: string,
    existing: UserWithRole,
    targetUserId: string,
  ): void {
    if (!existing || existing.id === targetUserId) return;

    throw new ConflictException(EMAIL_IDENTITY_MESSAGES.profileEmailInUse);
  }
}
