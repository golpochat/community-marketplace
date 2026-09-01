import { Injectable } from '@nestjs/common';

import type { AuthEventType } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

export interface AuditContext {
  email?: string;
  phone?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    eventType: AuthEventType,
    success: boolean,
    context: AuditContext,
    failureReason?: string,
  ): Promise<void> {
    await this.prisma.authLoginAudit.create({
      data: {
        eventType,
        email: context.email,
        phone: context.phone,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        success,
        failureReason,
      },
    });
  }
}
