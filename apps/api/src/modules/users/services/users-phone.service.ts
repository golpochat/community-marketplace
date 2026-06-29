import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  phoneChangeSendOtpSchema,
  phoneChangeVerifySchema,
} from '@community-marketplace/validation';

import { OtpService } from '../../auth/services/otp.service';
import { PrismaService } from '../../../database/prisma.service';
import { UserAuditService } from './user-audit.service';

@Injectable()
export class UsersPhoneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly audit: UserAuditService,
  ) {}

  async sendChangeOtp(userId: string, input: unknown) {
    const { phone } = phoneChangeSendOtpSchema.parse(input);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile?.phone === phone) {
      throw new BadRequestException('This is already your phone number');
    }

    await this.assertPhoneAvailable(phone, userId);

    await this.otpService.sendOtp({
      channel: 'phone',
      phone,
      purpose: 'phone_change',
    });

    await this.audit.record('phone_change_otp_sent', userId, userId, { phone });

    return {
      message: 'Verification code sent to your new number.',
    };
  }

  async confirmChange(userId: string, input: unknown) {
    const { phone, code } = phoneChangeVerifySchema.parse(input);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile?.phone === phone) {
      throw new BadRequestException('This is already your phone number');
    }

    await this.assertPhoneAvailable(phone, userId);

    await this.otpService.verifyOtp({
      channel: 'phone',
      phone,
      purpose: 'phone_change',
      code,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });

      await tx.userProfile.upsert({
        where: { userId },
        create: { userId, phone },
        update: { phone },
      });
    });

    await this.audit.record('phone_changed', userId, userId, { phone });

    return {
      message: 'Phone number updated successfully.',
      phone,
    };
  }

  private async assertPhoneAvailable(phone: string, userId: string) {
    const existingPhone = await this.prisma.userProfile.findUnique({
      where: { phone },
    });

    if (existingPhone && existingPhone.userId !== userId) {
      throw new ConflictException('Phone number is already in use');
    }
  }
}
