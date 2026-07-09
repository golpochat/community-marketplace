import {

  BadRequestException,

  ConflictException,

  ForbiddenException,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';



import type { LoginResponse, RbacRole, User } from '@community-marketplace/types';

import {
  activateEmailSchema,
  activationPreviewSchema,
  changePasswordSchema,
  completeRegistrationSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  passwordResetPreviewSchema,
  refreshTokenSchema,
  resendActivationSchema,
  resetPasswordSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../database/prisma.service';
import { hashPassword, verifyPassword } from '../../database/seeds/password-hash';

import { EventBusService } from '../../events/event-bus.service';

import type {

  ActivateEmailDto,

  ActivationPreviewDto,

  ChangePasswordDto,

  CompleteRegistrationDto,

  ForgotPasswordDto,

  LoginDto,

  LogoutDto,

  PasswordResetPreviewDto,

  RefreshTokenDto,

  RegisterDto,

  ResendActivationDto,

  ResetPasswordDto,

  SendOtpDto,

  VerifyOtpDto,

} from './dto/auth.dto';

import { AuthAuditService } from './services/auth-audit.service';

import { AuthSecurityService } from './services/auth-security.service';

import {

  buildActivationUrl,

  EmailActivationService,

} from './services/email-activation.service';

import { EmailIdentityService } from './services/email-identity.service';

import {
  buildPasswordResetUrl,
  PasswordResetService,
} from './services/password-reset.service';

import { JwtAuthService } from './services/jwt-auth.service';

import { OtpService } from './services/otp.service';

import { PhoneVerificationService } from './services/phone-verification.service';

import type { SessionContext } from './services/session.service';

import { SessionService } from './services/session.service';

import { generateSessionId } from './utils/token-hash';
import { assertUserCanAuthenticate } from './utils/user-auth-status';



@Injectable()

export class AuthService {

  constructor(

    private readonly otpService: OtpService,

    private readonly jwtAuthService: JwtAuthService,

    private readonly emailActivationService: EmailActivationService,

    private readonly emailIdentity: EmailIdentityService,

    private readonly passwordResetService: PasswordResetService,

    private readonly phoneVerificationService: PhoneVerificationService,

    private readonly sessionService: SessionService,

    private readonly securityService: AuthSecurityService,

    private readonly auditService: AuthAuditService,

    private readonly eventBus: EventBusService,

    private readonly prisma: PrismaService,

  ) {}



  async register(_dto: RegisterDto) {
    throw new BadRequestException(
      'Password self-registration is disabled. Use the phone OTP registration flow: POST /auth/otp/send, /auth/otp/verify, then /auth/register/complete.',
    );
  }

  async login(dto: LoginDto, context: SessionContext): Promise<LoginResponse> {

    loginSchema.parse(dto);



    await this.securityService.assertLoginAllowed(dto.email, context.ipAddress);



    const dbUser = await this.prisma.user.findUnique({

      where: { email: dto.email },

      include: { primaryRole: true },

    });



    if (!dbUser?.passwordHash || !verifyPassword(dto.password, dbUser.passwordHash)) {

      await this.auditService.record('login', false, { ...context, email: dto.email }, 'Invalid credentials');

      throw new UnauthorizedException('Invalid email or password');

    }



    if (!dbUser.emailVerifiedAt) {

      await this.auditService.record('login', false, { ...context, email: dto.email, userId: dbUser.id }, 'Email not activated');

      throw new ForbiddenException('Email not activated. Check your inbox or request a new link.');

    }



    try {
      assertUserCanAuthenticate(dbUser.status);
    } catch (error) {
      const reason = dbUser.status === 'inactive' ? 'Account deactivated' : 'Account suspended';
      await this.auditService.record('login', false, { ...context, email: dto.email, userId: dbUser.id }, reason);
      throw error;
    }



    const user = this.toUserFromDb(dbUser);

    const response = await this.establishSession(user, context);

    await this.auditService.record('login', true, { ...context, email: dto.email, userId: user.id });

    return response;

  }



  async sendOtp(dto: SendOtpDto, context: SessionContext) {

    if (dto.channel === 'phone' && dto.purpose === 'register' && dto.phone) {

      await this.assertPhoneAvailableForRegistration(dto.phone);

    }

    return this.otpService.sendOtp(dto, context);

  }



  async verifyOtp(dto: VerifyOtpDto, context: SessionContext) {

    const verified = await this.otpService.verifyOtp(dto, context);



    if (verified.purpose === 'register' && verified.channel === 'phone') {

      const { token, expiresInSeconds } = this.phoneVerificationService.createToken(verified.recipient);

      return {

        verified: true as const,

        phone: verified.recipient,

        phoneVerificationToken: token,

        expiresInSeconds,

        message: 'Phone verified. Enter your details to finish signing up.',

      };

    }



    const user = await this.resolveUserForOtp(verified.channel, verified.recipient);



    if (!user.phoneVerifiedAt && verified.channel === 'phone') {

      await this.prisma.user.update({

        where: { id: user.id },

        data: { phoneVerifiedAt: new Date() },

      });

    }



    const refreshed = await this.prisma.user.findUnique({

      where: { id: user.id },

      include: { primaryRole: true },

    });



    if (!refreshed?.emailVerifiedAt) {

      throw new ForbiddenException('Email not activated. Complete email activation first.');

    }

    assertUserCanAuthenticate(refreshed.status);



    const loginResponse = await this.establishSession(this.toUserFromDb(refreshed), context);

    await this.auditService.record('otp_verify', true, {

      ...context,

      phone: verified.channel === 'phone' ? verified.recipient : undefined,

      email: verified.channel === 'email' ? verified.recipient : refreshed.email,

      userId: refreshed.id,

    });

    return loginResponse;

  }



  async completeRegistration(dto: CompleteRegistrationDto, context: SessionContext) {

    const parsed = completeRegistrationSchema.parse(dto);

    const phonePayload = this.phoneVerificationService.verifyToken(parsed.phoneVerificationToken);



    await this.emailIdentity.assertAvailableForPublicRegistration(parsed.email);



    if (await this.prisma.userProfile.findUnique({ where: { phone: phonePayload.phone } })) {

      throw new ConflictException('Phone number is already registered');

    }



    if (await this.prisma.pendingRegistration.findUnique({ where: { phone: phonePayload.phone } })) {

      const pending = await this.prisma.pendingRegistration.findUnique({ where: { phone: phonePayload.phone } });

      if (pending && pending.expiresAt < new Date()) {

        await this.prisma.pendingRegistration.delete({ where: { phone: phonePayload.phone } });

      } else if (pending && pending.email !== parsed.email) {

        throw new ConflictException('Phone number is already pending registration');

      }

    }



    await this.emailActivationService.stageRegistration({

      email: parsed.email,

      phone: phonePayload.phone,

      name: parsed.name,

      accountType: parsed.accountType,

      sellerKind: parsed.sellerKind,

    });



    const activationToken = this.emailActivationService.createActivationToken({

      email: parsed.email,

      phone: phonePayload.phone,

      name: parsed.name,

      accountType: parsed.accountType,

      sellerKind: parsed.sellerKind,

    });



    const appBaseUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';



    this.eventBus.publish({

      type: 'user.registration_pending',

      payload: {

        email: parsed.email,

        phone: phonePayload.phone,

        name: parsed.name,

        activationToken,

        activationUrl: buildActivationUrl(appBaseUrl, activationToken),

      },

      timestamp: new Date(),

    });



    await this.auditService.record('registration_complete', true, {

      ...context,

      email: parsed.email,

      phone: phonePayload.phone,

    });



    return {

      email: parsed.email,

      activationExpiresIn: this.emailActivationService.getActivationExpiresIn(),

      message: 'Check your email to activate your account.',

    };

  }



  async activationPreview(dto: ActivationPreviewDto) {

    activationPreviewSchema.parse(dto);

    return this.emailActivationService.previewActivation(dto.token);

  }



  async activateEmail(dto: ActivateEmailDto, context: SessionContext) {

    const parsed = activateEmailSchema.parse(dto);

    const result = await this.emailActivationService.activate(parsed.token, parsed.password);



    if (result.alreadyActivated) {
      await this.auditService.record('activation', true, {
        ...context,
        email: result.email,
        userId: result.userId,
      });
      return {
        activated: false,
        email: result.email,
        userId: result.userId,
      };
    }

    if (!result.user) {
      throw new BadRequestException('Activation failed');
    }

    const user = this.toUserFromDb(result.user);

    const loginResponse = await this.establishSession(user, context);



    await this.auditService.record('activation', true, {

      ...context,

      email: result.email,

      userId: result.userId,

    });

    this.eventBus.publish({
      type: 'user.activated',
      payload: {
        userId: result.userId,
        deviceFingerprint: context.deviceFingerprint,
      },
      timestamp: new Date(),
    });

    return {

      activated: true,

      email: result.email,

      userId: result.userId,

      login: loginResponse,

    };

  }



  async resendActivation(dto: ResendActivationDto) {

    const parsed = resendActivationSchema.parse(dto);
    const result = await this.emailActivationService.resend(parsed.email);

    const appBaseUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';



    this.eventBus.publish({

      type: 'user.activation_resent',

      payload: {

        email: result.email,

        activationToken: result.token,

        activationUrl: buildActivationUrl(appBaseUrl, result.token),

      },

      timestamp: new Date(),

    });



    return {

      email: result.email,

      message: 'Activation email resent',

    };

  }



  async forgotPassword(dto: ForgotPasswordDto, context: SessionContext) {
    const parsed = forgotPasswordSchema.parse(dto);
    const genericMessage =
      'If an account exists for this email, we sent a password reset link. Check your inbox and spam folder.';

    await this.securityService.assertPasswordResetAllowed(parsed.email, context.ipAddress);

    const user = await this.prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (user) {
      await this.sendPasswordResetEmailForUser(user, context);
    } else {
      await this.auditService.record('password_reset_request', true, {
        ...context,
        email: parsed.email,
      });
    }

    return { message: genericMessage };
  }

  async sendPasswordResetEmailForUser(
    user: {
      id: string;
      email: string;
      displayName: string | null;
      emailVerifiedAt: Date | null;
      passwordHash: string | null;
    },
    context: SessionContext,
  ): Promise<boolean> {
    if (!user.emailVerifiedAt || !user.passwordHash) {
      return false;
    }

    const token = this.passwordResetService.createResetToken(user.email, user.id);
    const appBaseUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';

    this.eventBus.publish({
      type: 'user.password_reset_requested',
      payload: {
        email: user.email,
        name: user.displayName ?? undefined,
        resetToken: token,
        resetUrl: buildPasswordResetUrl(appBaseUrl, token),
      },
      timestamp: new Date(),
    });

    await this.auditService.record('password_reset_request', true, {
      ...context,
      email: user.email,
      userId: user.id,
    });

    return true;
  }



  async passwordResetPreview(dto: PasswordResetPreviewDto) {
    passwordResetPreviewSchema.parse(dto);
    return this.passwordResetService.previewReset(dto.token);
  }



  async resetPassword(dto: ResetPasswordDto, context: SessionContext) {
    const parsed = resetPasswordSchema.parse(dto);
    const result = await this.passwordResetService.resetPassword(parsed.token, parsed.password);

    await this.sessionService.revokeAllForUser(result.userId);

    const user = this.toUserFromDb(result.user);
    const loginResponse = await this.establishSession(user, context);

    await this.auditService.record('password_reset', true, {
      ...context,
      email: result.email,
      userId: result.userId,
    });

    return {
      email: result.email,
      userId: result.userId,
      login: loginResponse,
    };
  }



  async changePassword(userId: string, dto: ChangePasswordDto, context: SessionContext) {
    const parsed = changePasswordSchema.parse(dto);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { primaryRole: true },
    });

    if (!dbUser?.passwordHash || !verifyPassword(parsed.currentPassword, dbUser.passwordHash)) {
      await this.auditService.record('password_change', false, {
        ...context,
        userId,
        email: dbUser?.email,
      }, 'Invalid current password');
      throw new UnauthorizedException('Current password is incorrect');
    }

    assertUserCanAuthenticate(dbUser.status);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(parsed.newPassword) },
    });

    await this.sessionService.revokeAllForUser(userId);

    const refreshed = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { primaryRole: true },
    });

    if (!refreshed) {
      throw new UnauthorizedException('User not found');
    }

    const user = this.toUserFromDb(refreshed);
    const loginResponse = await this.establishSession(user, context);

    await this.auditService.record('password_change', true, {
      ...context,
      userId,
      email: refreshed.email,
    });

    return {
      message: 'Password updated successfully.',
      login: loginResponse,
    };
  }



  async refreshToken(dto: RefreshTokenDto, context: SessionContext, cookieRefreshToken?: string) {

    const refreshToken = dto.refreshToken ?? cookieRefreshToken;

    if (!refreshToken) {

      throw new UnauthorizedException('Refresh token is required');

    }



    refreshTokenSchema.parse({ refreshToken });

    const payload = this.jwtAuthService.verifyRefreshToken(refreshToken);



    await this.sessionService.assertRefreshSession(payload.sid, refreshToken, payload.sub);



    const dbUser = await this.prisma.user.findUnique({

      where: { id: payload.sub },

      include: { primaryRole: true },

    });



    if (!dbUser) {

      throw new UnauthorizedException('User not found');

    }

    assertUserCanAuthenticate(dbUser.status);



    const user = this.toUserFromDb(dbUser);

    const newSessionId = generateSessionId();

    const tokens = this.jwtAuthService.issueTokenPair(user, newSessionId);

    await this.sessionService.revokeSession(payload.sid);

    await this.sessionService.createSession(user, tokens.refreshToken, context);



    await this.auditService.record('refresh', true, { ...context, userId: user.id, email: user.email });



    return this.jwtAuthService.toAuthResponse(user, tokens);

  }



  async logout(user: { id: string }, dto: LogoutDto, context: SessionContext) {

    logoutSchema.parse(dto);



    if (dto.sessionId) {

      await this.sessionService.revokeSession(dto.sessionId);

    } else if (dto.refreshToken) {

      await this.sessionService.revokeByRefreshToken(dto.refreshToken);

    } else {

      await this.sessionService.revokeAllForUser(user.id);

    }



    await this.auditService.record('logout', true, { ...context, userId: user.id });



    return { loggedOut: true };

  }



  private async establishSession(user: User, context: SessionContext): Promise<LoginResponse> {
    assertUserCanAuthenticate(user.status);

    const sessionId = generateSessionId();

    const tokens = this.jwtAuthService.issueTokenPair(user, sessionId);

    await this.sessionService.createSession(user, tokens.refreshToken, context);



    this.eventBus.publish({

      type: 'user.logged_in',

      payload: { userId: user.id, sessionId },

      timestamp: new Date(),

    });



    return this.jwtAuthService.toAuthResponse(user, tokens);

  }



  private async resolveUserForOtp(channel: 'email' | 'phone', recipient: string) {

    if (channel === 'email') {

      const user = await this.prisma.user.findUnique({

        where: { email: recipient },

        include: { primaryRole: true },

      });

      if (!user) {

        throw new BadRequestException('No account found for this email');

      }

      return user;

    }



    const profile = await this.prisma.userProfile.findFirst({

      where: { phone: recipient },

      include: { user: { include: { primaryRole: true } } },

    });



    if (!profile?.user) {

      throw new BadRequestException('No account found for this phone number');

    }



    return profile.user;

  }



  private async assertPhoneAvailableForRegistration(phone: string) {

    const existingProfile = await this.prisma.userProfile.findUnique({ where: { phone } });

    if (existingProfile) {

      throw new ConflictException('This phone number is already registered. Sign in instead.');

    }



    const pending = await this.prisma.pendingRegistration.findUnique({ where: { phone } });

    if (pending && pending.expiresAt >= new Date()) {

      throw new ConflictException(

        'This phone number is already pending registration. Check your email or try again later.',

      );

    }

    if (pending && pending.expiresAt < new Date()) {

      await this.prisma.pendingRegistration.delete({ where: { phone } });

    }

  }



  private toUserFromDb(dbUser: {

    id: string;

    email: string;

    displayName: string | null;

    primaryRoleId: string;

    status: string;

    emailVerifiedAt?: Date | null;

    phoneVerifiedAt?: Date | null;

    profileCompleted?: boolean;

    createdAt: Date;

    updatedAt: Date;

    primaryRole: { code: string };

  }): User {

    return {

      id: dbUser.id,

      email: dbUser.email,

      displayName: dbUser.displayName ?? undefined,

      primaryRoleId: dbUser.primaryRoleId,

      role: dbUser.primaryRole.code as RbacRole,

      status: dbUser.status as User['status'],

      emailVerified: Boolean(dbUser.emailVerifiedAt),

      phoneVerified: Boolean(dbUser.phoneVerifiedAt),

      profileCompleted: dbUser.profileCompleted ?? false,

      createdAt: dbUser.createdAt.toISOString(),

      updatedAt: dbUser.updatedAt.toISOString(),

    };

  }

}


