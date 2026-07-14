import type { RbacRole } from './rbac';
import { ACCOUNT_DASHBOARD_PATH } from './marketplace-account';
import type { User } from './user';

export type OtpChannel = 'email' | 'phone';

export type OtpPurpose =
  | 'login'
  | 'register'
  | 'password_reset'
  | 'seller_verify'
  | 'phone_change';

export type RegistrationAccountType = 'buyer' | 'seller';

export type LoginAppTarget = 'web' | 'admin';

export type AuthEventType =
  | 'login'
  | 'logout'
  | 'otp_send'
  | 'otp_verify'
  | 'activation'
  | 'registration_complete'
  | 'password_reset_request'
  | 'password_reset'
  | 'password_change'
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
  email: string;
  phone: string;
  accountType: RegistrationAccountType;
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

/** Signed JWT payload for password reset links */
export interface PasswordResetTokenPayload {
  email: string;
  userId: string;
  type: 'password_reset';
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
  /** Present only in dev / OTP pilot mode — never when live SMS is enabled. */
  devCode?: string;
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

export interface ActivationPreviewResponse {
  email: string;
  accountType: RegistrationAccountType;
  alreadyActivated: boolean;
}

export interface EmailActivationResponse {
  activated: boolean;
  email: string;
  userId: string;
  login?: LoginResponse;
}

export interface AdminInvitationPreviewResponse {
  email: string;
  displayName: string;
  roleCode: string;
  roleName: string;
  expired: boolean;
  alreadyAccepted: boolean;
}

export interface AdminInvitationAcceptResponse {
  email: string;
  userId: string;
  login: LoginResponse;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface PasswordResetPreviewResponse {
  email: string;
  expired: boolean;
}

export interface PasswordResetResponse {
  email: string;
  userId: string;
  login: LoginResponse;
}

export interface ChangePasswordResponse {
  message: string;
  login: LoginResponse;
}

const LOGIN_REDIRECT_PATHS: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  MEMBER: ACCOUNT_DASHBOARD_PATH,
  SELLER: ACCOUNT_DASHBOARD_PATH,
  BUYER: ACCOUNT_DASHBOARD_PATH,
};

const LOGIN_APP_TARGETS: Record<RbacRole, LoginAppTarget> = {
  SUPER_ADMIN: 'web',
  ADMIN: 'web',
  MEMBER: 'web',
  SELLER: 'web',
  BUYER: 'web',
};

export function getLoginRedirectPath(role: RbacRole): string {
  return LOGIN_REDIRECT_PATHS[role];
}

/** Redirect path for panel operators (ADMIN + custom level-2 roles). */
export function getPanelLoginRedirectPath(roleCode: string): string {
  if (roleCode === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (roleCode === 'MEMBER' || roleCode === 'SELLER' || roleCode === 'BUYER') {
    return ACCOUNT_DASHBOARD_PATH;
  }
  return '/admin/dashboard';
}

export function getLoginAppTarget(role: RbacRole): LoginAppTarget {
  return LOGIN_APP_TARGETS[role];
}
