import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { CSRF_COOKIE_NAME, createCsrfToken } from '../../common/csrf/csrf.util';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Authenticated } from '../../common/decorators/rbac.decorator';
import { AuthService } from './auth.service';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} from './utils/auth-cookies';
import { computeDeviceFingerprint } from './utils/device-fingerprint';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipCsrf()
  @Get('csrf')
  issueCsrf(@Res({ passthrough: true }) res: Response) {
    const { token, cookieValue } = createCsrfToken();
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { token };
  }

  @Public()
  @Post('register')
  register(@Body() body: unknown) {
    return this.authService.register(body);
  }

  @Public()
  @Post('register/complete')
  completeRegistration(@Body() body: unknown, @Req() req: Request) {
    return this.authService.completeRegistration(body, this.sessionContext(req));
  }

  @Public()
  @Post('login')
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body, this.sessionContext(req));
    setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post('otp/send')
  sendOtp(@Body() body: unknown, @Req() req: Request) {
    return this.authService.sendOtp(body, this.sessionContext(req));
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyOtp(body, this.sessionContext(req));
    if ('refreshToken' in result) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    return result;
  }

  @Public()
  @Post('activate/preview')
  activationPreview(@Body() body: unknown) {
    return this.authService.activationPreview(body);
  }

  @Public()
  @Post('activate')
  async activateEmail(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.activateEmail(body, this.sessionContext(req));
    if (result.login) {
      setRefreshTokenCookie(res, result.login.refreshToken);
    }
    return result;
  }

  @Public()
  @Post('activate/resend')
  resendActivation(@Body() body: unknown) {
    return this.authService.resendActivation(body);
  }

  @Public()
  @Post('password/forgot')
  forgotPassword(@Body() body: unknown, @Req() req: Request) {
    return this.authService.forgotPassword(body, this.sessionContext(req));
  }

  @Public()
  @Post('password/reset/preview')
  passwordResetPreview(@Body() body: unknown) {
    return this.authService.passwordResetPreview(body);
  }

  @Public()
  @Post('password/reset')
  async resetPassword(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(body, this.sessionContext(req));
    setRefreshTokenCookie(res, result.login.refreshToken);
    return result;
  }

  @Authenticated()
  @Post('password/change')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.id, body, this.sessionContext(req));
    setRefreshTokenCookie(res, result.login.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const result = await this.authService.refreshToken(body, this.sessionContext(req), cookieToken);
    setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Authenticated()
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const payload =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const result = await this.authService.logout(
      user,
      { ...payload, refreshToken: payload.refreshToken ?? cookieToken },
      this.sessionContext(req),
    );
    clearRefreshTokenCookie(res);
    return result;
  }

  private sessionContext(req: Request) {
    const clientFingerprint = req.headers['x-device-fingerprint'];
    const fingerprintHeader = typeof clientFingerprint === 'string' ? clientFingerprint : undefined;

    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceFingerprint: computeDeviceFingerprint(
        req.headers['user-agent'],
        req.ip,
        fingerprintHeader,
      ),
    };
  }
}
