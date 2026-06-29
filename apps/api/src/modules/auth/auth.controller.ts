import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import {
  ActivateEmailDto,
  ActivationPreviewDto,
  CompleteRegistrationDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResendActivationDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
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
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('register/complete')
  completeRegistration(@Body() dto: CompleteRegistrationDto, @Req() req: Request) {
    return this.authService.completeRegistration(dto, this.sessionContext(req));
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, this.sessionContext(req));
    setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    return this.authService.sendOtp(dto, this.sessionContext(req));
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyOtp(dto, this.sessionContext(req));
    if ('refreshToken' in result) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    return result;
  }

  @Public()
  @Post('activate/preview')
  activationPreview(@Body() dto: ActivationPreviewDto) {
    return this.authService.activationPreview(dto);
  }

  @Public()
  @Post('activate')
  async activateEmail(@Body() dto: ActivateEmailDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.activateEmail(dto, this.sessionContext(req));
    if (result.login) {
      setRefreshTokenCookie(res, result.login.refreshToken);
    }
    return result;
  }

  @Public()
  @Post('activate/resend')
  resendActivation(@Body() dto: ResendActivationDto) {
    return this.authService.resendActivation(dto);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const result = await this.authService.refreshToken(dto, this.sessionContext(req), cookieToken);
    setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const result = await this.authService.logout(
      user,
      { ...dto, refreshToken: dto.refreshToken ?? cookieToken },
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

