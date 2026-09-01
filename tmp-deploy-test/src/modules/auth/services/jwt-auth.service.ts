import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  getLoginAppTarget,
  getLoginRedirectPath,
  type AuthPayload,
  type LoginResponse,
  type SessionTokens,
  type User,
} from '@community-marketplace/types';
import { toIsoString } from '@community-marketplace/utils';

export type { AuthPayload };

export type IssuedTokens = SessionTokens;

@Injectable()
export class JwtAuthService {
  private static readonly ACCESS_TTL_SECONDS = 15 * 60;

  constructor(private readonly jwtService: JwtService) {}

  issueTokenPair(user: User, sessionId: string): IssuedTokens {
    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      primaryRoleId: user.primaryRoleId,
      sid: sessionId,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: JwtAuthService.ACCESS_TTL_SECONDS,
      }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expiresIn: JwtAuthService.ACCESS_TTL_SECONDS,
      sessionId,
      issuedAt: toIsoString(),
    };
  }

  verifyAccessToken(token: string): AuthPayload {
    return this.jwtService.verify<AuthPayload>(token);
  }

  verifyRefreshToken(token: string): AuthPayload {
    return this.jwtService.verify<AuthPayload>(token);
  }

  toAuthResponse(user: User, tokens: IssuedTokens): LoginResponse {
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      sessionId: tokens.sessionId,
      issuedAt: tokens.issuedAt,
      redirectPath: getLoginRedirectPath(user.role),
      appTarget: getLoginAppTarget(user.role),
    };
  }
}
