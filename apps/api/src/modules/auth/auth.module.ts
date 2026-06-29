import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { LibsModule } from '../../libs/libs.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthSecurityService } from './services/auth-security.service';
import { AuthActivationListener } from './listeners/auth-activation.listener';
import { ActivationEmailService } from './services/activation-email.service';
import { EmailActivationService } from './services/email-activation.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { OtpService } from './services/otp.service';
import { PhoneVerificationService } from './services/phone-verification.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    LibsModule,
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
    AuthActivationListener,
    PhoneVerificationService,
    SessionService,
    AuthAuditService,
    AuthSecurityService,
  ],
  exports: [AuthService, JwtAuthService, SessionService, OtpService],
})
export class AuthModule {}

