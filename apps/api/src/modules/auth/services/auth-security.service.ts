import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AuthAuditService } from './auth-audit.service';
import { PrismaService } from '../../../database/prisma.service';

const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

@Injectable()
export class AuthSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuthAuditService,
  ) {}

  async assertLoginAllowed(email: string, ipAddress?: string): Promise<void> {
    const since = new Date(Date.now() - BRUTE_FORCE_WINDOW_MS);

    const [emailFailures, ipFailures] = await Promise.all([
      this.prisma.authLoginAudit.count({
        where: {
          eventType: 'login',
          success: false,
          email,
          createdAt: { gte: since },
        },
      }),
      ipAddress
        ? this.prisma.authLoginAudit.count({
            where: {
              eventType: 'login',
              success: false,
              ipAddress,
              createdAt: { gte: since },
            },
          })
        : Promise.resolve(0),
    ]);

    if (emailFailures >= MAX_FAILED_ATTEMPTS || ipFailures >= MAX_FAILED_ATTEMPTS * 2) {
      await this.audit.record(
        'brute_force_blocked',
        false,
        { email, ipAddress },
        'Too many failed login attempts',
      );
      throw new HttpException(
        'Too many failed login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
