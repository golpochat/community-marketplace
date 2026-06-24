import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { User } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { generateSessionId, hashToken } from '../utils/token-hash';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(user: User, refreshToken: string, context: SessionContext = {}) {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        deviceFingerprint: context.deviceFingerprint,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return sessionId;
  }

  async assertRefreshSession(sessionId: string, refreshToken: string, userId: string) {
    const session = await this.prisma.authSession.findUnique({ where: { id: sessionId } });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return session;
  }

  async rotateSession(
    sessionId: string,
    user: User,
    newRefreshToken: string,
    context: SessionContext = {},
  ) {
    await this.revokeSession(sessionId);
    return this.createSession(user, newRefreshToken, context);
  }

  async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByRefreshToken(refreshToken: string) {
    const hash = hashToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
