import { z } from 'zod';

const currencySchema = z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO currency code');

export const platformGovernanceUpdateSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    platformNameOverrideEnabled: z.boolean().optional(),
    platformName: z.string().min(1).max(120).nullable().optional(),
    supportEmailOverrideEnabled: z.boolean().optional(),
    supportEmail: z.string().email().nullable().optional(),
    defaultCurrencyOverrideEnabled: z.boolean().optional(),
    defaultCurrency: currencySchema.nullable().optional(),
    emailNotificationsEnabled: z.boolean().optional(),
    pushNotificationsEnabled: z.boolean().optional(),
    securityMfaRequired: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.platformNameOverrideEnabled && !value.platformName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Platform name is required when override is enabled',
        path: ['platformName'],
      });
    }
    if (value.supportEmailOverrideEnabled && !value.supportEmail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Support email is required when override is enabled',
        path: ['supportEmail'],
      });
    }
    if (value.defaultCurrencyOverrideEnabled && !value.defaultCurrency?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default currency is required when override is enabled',
        path: ['defaultCurrency'],
      });
    }
  });

export type PlatformGovernanceUpdateInput = z.infer<typeof platformGovernanceUpdateSchema>;
