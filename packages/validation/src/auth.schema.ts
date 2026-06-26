import { z } from 'zod';

import { emailSchema, passwordSchema } from './common.schema';

export const otpPurposeSchema = z.enum(['login', 'register', 'password_reset', 'seller_verify']);

export const otpChannelSchema = z.enum(['email', 'phone']);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format (e.g. +14155552671)');

export const displayNameSchema = z.string().trim().min(1).max(100);

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

export const completeRegistrationSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  phoneVerificationToken: z.string().min(1),
});

export const activateEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendActivationSchema = z.object({
  email: emailSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  sessionId: z.string().uuid().optional(),
});

export const deviceFingerprintHeaderSchema = z.string().min(8).max(128).optional();

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
export type ActivateEmailInput = z.infer<typeof activateEmailSchema>;
export type ResendActivationInput = z.infer<typeof resendActivationSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
