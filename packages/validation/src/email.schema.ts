import { z } from 'zod';

export const emailProviderIdSchema = z.enum(['brevo', 'sendgrid', 'ses', 'stub']);

export const emailPlatformSettingsUpdateSchema = z
  .object({
    emailProvider: emailProviderIdSchema.optional(),
    emailFallbackEnabled: z.boolean().optional(),
    emailFromAddressOverrideEnabled: z.boolean().optional(),
    emailFromAddress: z.string().email().nullable().optional(),
    emailFromNameOverrideEnabled: z.boolean().optional(),
    emailFromName: z.string().min(1).max(120).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.emailFromAddressOverrideEnabled && !value.emailFromAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From address is required when override is enabled',
        path: ['emailFromAddress'],
      });
    }
    if (value.emailFromNameOverrideEnabled && !value.emailFromName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From name is required when override is enabled',
        path: ['emailFromName'],
      });
    }
  });

export const emailTestSendSchema = z.object({
  to: z.string().email(),
});

export type EmailPlatformSettingsUpdateInput = z.infer<typeof emailPlatformSettingsUpdateSchema>;
export type EmailTestSendInput = z.infer<typeof emailTestSendSchema>;
