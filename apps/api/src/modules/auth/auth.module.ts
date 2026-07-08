import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { LibsModule } from '../../libs/libs.module';
import { EmailModule } from '../../email/email.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthSecurityService } from './services/auth-security.service';
import { AuthActivationListener } from './listeners/auth-activation.listener';
import { AuthPasswordResetListener } from './listeners/auth-password-reset.listener';
import { ActivationEmailService } from './services/activation-email.service';
import { EmailActivationService } from './services/email-activation.service';
import { PasswordResetEmailService } from './services/password-reset-email.service';
import { PasswordResetService } from './services/password-reset.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { OtpService } from './services/otp.service';
import { PhoneVerificationService } from './services/phone-verification.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    LibsModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtAuthService,
    EmailActivationService,
    ActivationEmailService,
    PasswordResetService,
    PasswordResetEmailService,
    AuthActivationListener,
    AuthPasswordResetListener,
    PhoneVerificationService,
    SessionService,
    AuthAuditService,
    AuthSecurityService,
  ],
  exports: [AuthService, JwtAuthService, SessionService, OtpService],
})
export class AuthModule {}

