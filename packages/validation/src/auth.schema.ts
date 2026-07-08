import { z } from 'zod';

import {
  IRISH_MOBILE_VALIDATION_MESSAGE,
  normalizeIrishPhoneToE164,
} from './irish-phone';

import { emailSchema, passwordSchema } from './common.schema';

export const otpPurposeSchema = z.enum([
  'login',
  'register',
  'password_reset',
  'seller_verify',
  'phone_change',
]);

export const otpChannelSchema = z.enum(['email', 'phone']);

export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const e164 = normalizeIrishPhoneToE164(value);
    if (!e164) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: IRISH_MOBILE_VALIDATION_MESSAGE,
      });
      return z.NEVER;
    }
    return e164;
  });

export const displayNameSchema = z.string().trim().min(1).max(100);

export const registrationAccountTypeSchema = z.enum(['buyer', 'seller']);

export const sellerRegistrationKindSchema = z.enum([
  'individual',
  'sole_trader',
  'limited_company',
]);

export const sendOtpSchema = z
  .object({
    channel: otpChannelSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    purpose: otpPurposeSchema,
  })
  .superRefine((value, ctx) => {
    if (value.channel === 'email' && !value.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'email is required for email OTP', path: ['email'] });
    }
    if (value.channel === 'phone' && !value.phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone is required for phone OTP', path: ['phone'] });
    }
  });

export const verifyOtpSchema = z
  .object({
    channel: otpChannelSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    purpose: otpPurposeSchema,
  })
  .superRefine((value, ctx) => {
    if (value.channel === 'email' && !value.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'email is required for email OTP', path: ['email'] });
    }
    if (value.channel === 'phone' && !value.phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone is required for phone OTP', path: ['phone'] });
    }
  });

export const completeRegistrationSchema = z
  .object({
    accountType: registrationAccountTypeSchema,
    name: displayNameSchema,
    email: emailSchema,
    phoneVerificationToken: z.string().min(1),
    sellerKind: sellerRegistrationKindSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accountType === 'seller' && !value.sellerKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose how you sell: individual, sole trader, or limited company',
        path: ['sellerKind'],
      });
    }
    if (value.accountType === 'buyer' && value.sellerKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sellerKind is only valid for seller accounts',
        path: ['sellerKind'],
      });
    }
  });

export const activationPreviewSchema = z.object({
  token: z.string().min(1),
});

export const activateEmailSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const resendActivationSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const passwordResetPreviewSchema = z.object({
  token: z.string().min(1),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    if (value.currentPassword === value.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must be different from your current password',
        path: ['newPassword'],
      });
    }
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  sessionId: z.string().uuid().optional(),
});

export const deviceFingerprintHeaderSchema = z.string().min(8).max(128).optional();

export type RegistrationAccountType = z.infer<typeof registrationAccountTypeSchema>;
export type SellerRegistrationKindInput = z.infer<typeof sellerRegistrationKindSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
export type ActivationPreviewInput = z.infer<typeof activationPreviewSchema>;
export type ActivateEmailInput = z.infer<typeof activateEmailSchema>;
export type ResendActivationInput = z.infer<typeof resendActivationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type PasswordResetPreviewInput = z.infer<typeof passwordResetPreviewSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
