import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { OtpChannel, OtpPurpose } from '@prisma/client';

import type {
  OtpChannel as OtpChannelType,
  OtpPurpose as OtpPurposeType,
  OtpSentResponse,
} from '@community-marketplace/types';
import { sendOtpSchema, verifyOtpSchema } from '@community-marketplace/validation';

import { LoggerLib } from '../../../libs/logger.lib';
import { PrismaService } from '../../../database/prisma.service';
import { isOtpPilotMode } from '../utils/otp-pilot-mode';
import { generateOtpCode, hashToken } from '../utils/token-hash';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerLib,
  ) {}

  async sendOtp(
    input: unknown,
    context?: { ipAddress?: string; deviceFingerprint?: string },
  ): Promise<OtpSentResponse> {
    const dto = sendOtpSchema.parse(input);
    const recipient = dto.channel === 'email' ? dto.email! : dto.phone!;
    const purpose = dto.purpose as OtpPurpose;

    await this.assertSendRateLimit(dto.channel as OtpChannel, recipient, purpose);

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.authOtp.create({
      data: {
        channel: dto.channel as OtpChannel,
        recipient,
        codeHash: hashToken(code),
        purpose,
        expiresAt,
      },
    });

    const channelLabel = dto.channel === 'phone' ? 'phone' : 'email';
    this.logger.log(
      'OtpService',
      `OTP sent to ${channelLabel} ${recipient} (dev code: ${code}) [ip=${context?.ipAddress ?? 'unknown'}]`,
    );

    const response: OtpSentResponse = {
      channel: dto.channel as OtpChannelType,
      recipient,
      purpose: dto.purpose as OtpPurposeType,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      message: isOtpPilotMode()
        ? `Verification code ready (pilot mode — no ${channelLabel} message sent)`
        : `OTP sent to your ${channelLabel}`,
    };

    if (isOtpPilotMode()) {
      response.devCode = code;
    }

    return response;
  }

  async verifyOtp(input: unknown, _context?: { ipAddress?: string; deviceFingerprint?: string }) {
    const dto = verifyOtpSchema.parse(input);
    const recipient = dto.channel === 'email' ? dto.email! : dto.phone!;
    const purpose = dto.purpose as OtpPurpose;

    const otp = await this.prisma.authOtp.findFirst({
      where: {
        channel: dto.channel as OtpChannel,
        recipient,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new HttpException('Too many invalid OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (otp.codeHash !== hashToken(dto.code)) {
      await this.prisma.authOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP code');
    }

    await this.prisma.authOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    return {
      channel: dto.channel as OtpChannelType,
      recipient,
      purpose: dto.purpose as OtpPurposeType,
    };
  }

  private async assertSendRateLimit(
    channel: OtpChannel,
    recipient: string,
    purpose: OtpPurpose,
  ) {
    const since = new Date(Date.now() - SEND_WINDOW_MS);
    const recentCount = await this.prisma.authOtp.count({
      where: { channel, recipient, purpose, createdAt: { gte: since } },
    });

    if (recentCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpException('OTP rate limit exceeded. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
