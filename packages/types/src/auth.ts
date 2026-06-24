import type { RbacRole } from './rbac';
import type { User } from './user';

export type OtpChannel = 'email' | 'phone';

export type OtpPurpose = 'login' | 'register' | 'password_reset';

export type LoginAppTarget = 'web' | 'admin';

export type AuthEventType =
  | 'login'
  | 'logout'
  | 'otp_send'
  | 'otp_verify'
  | 'activation'
  | 'registration_complete'
  | 'refresh'
  | 'brute_force_blocked';

/** JWT access/refresh token payload */
export interface AuthPayload {
  sub: string;
  email: string;
  role: RbacRole;
  primaryRoleId: string;
  sid: string;
}

/** Signed JWT payload for email activation (user created on activation) */
export interface ActivationTokenPayload {
  name: string;
  email: string;
  phone: string;
  type: 'email_activation';
  iat: number;
  exp: number;
}

/** Short-lived JWT after phone OTP verification during registration */
export interface PhoneVerificationTokenPayload {
  phone: string;
  type: 'phone_verification';
  purpose: 'register';
  iat: number;
  exp: number;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  issuedAt: string;
}

/** @deprecated Use SessionTokens */
export type AuthTokens = SessionTokens;

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  issuedAt: string;
  redirectPath: string;
  appTarget: LoginAppTarget;
}

/** @deprecated Use LoginResponse */
export type AuthResponse = LoginResponse;

export interface RegisterResponse {
  user: User;
  activationRequired: boolean;
  activationExpiresIn: number;
  message: string;
}

export interface OtpSentResponse {
  channel: OtpChannel;
  recipient: string;
  purpose: OtpPurpose;
  expiresInSeconds: number;
  message: string;
}

export interface OtpVerifiedResponse {
  verified: true;
  phone: string;
  phoneVerificationToken: string;
  expiresInSeconds: number;
  message: string;
}

export interface CompleteRegistrationResponse {
  email: string;
  activationExpiresIn: number;
  message: string;
}

export interface EmailActivationResponse {
  activated: boolean;
  email: string;
  userId: string;
  login?: LoginResponse;
}

const LOGIN_REDIRECT_PATHS: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  SELLER: '/seller/dashboard',
  BUYER: '/buyer/dashboard',
};

const LOGIN_APP_TARGETS: Record<RbacRole, LoginAppTarget> = {
  SUPER_ADMIN: 'admin',
  ADMIN: 'admin',
  SELLER: 'web',
  BUYER: 'web',
};

export function getLoginRedirectPath(role: RbacRole): string {
  return LOGIN_REDIRECT_PATHS[role];
}

export function getLoginAppTarget(role: RbacRole): LoginAppTarget {
  return LOGIN_APP_TARGETS[role];
}
