import { z } from 'zod';

import { emailSchema } from './common.schema';
import { displayNameSchema, phoneSchema, sellerRegistrationKindSchema } from './auth.schema';

export const sellerBusinessStructureSchema = sellerRegistrationKindSchema;

/** Legal full name as shown on government ID — private, never public. */
export const personalDetailsLegalNameSchema = displayNameSchema;

/** @deprecated Use personalDetailsLegalNameSchema */
export const personalDetailsFullNameSchema = personalDetailsLegalNameSchema;

export const personalDetailsEmailSchema = emailSchema;

export const personalDetailsPhoneSchema = phoneSchema;

export const croNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{6,8}$/, 'CRO number must be 6–8 digits');

export const registeredCompanyNameSchema = z.string().trim().min(1).max(200);

/** Required personal details for seller identity verification. */
export const sellerPersonalDetailsSchema = z
  .object({
    legalName: personalDetailsLegalNameSchema,
    email: personalDetailsEmailSchema,
    phone: personalDetailsPhoneSchema,
    registeredCompanyName: registeredCompanyNameSchema.optional(),
    croNumber: croNumberSchema.optional(),
    businessStructure: sellerBusinessStructureSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.businessStructure === 'limited_company') {
      if (!value.registeredCompanyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Registered company name is required for limited companies',
          path: ['registeredCompanyName'],
        });
      }
      if (!value.croNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CRO number is required for limited companies',
          path: ['croNumber'],
        });
      }
    }
  });

/** Partial update during verification onboarding (at least one field). */
export const sellerPersonalDetailsUpdateSchema = z
  .object({
    legalName: personalDetailsLegalNameSchema.optional(),
    /** @deprecated Use legalName */
    fullName: personalDetailsLegalNameSchema.optional(),
    email: personalDetailsEmailSchema.optional(),
    phone: personalDetailsPhoneSchema.optional(),
    registeredCompanyName: registeredCompanyNameSchema.optional(),
    croNumber: croNumberSchema.optional(),
    businessStructure: sellerBusinessStructureSchema.optional(),
  })
  .refine(
    (value) =>
      value.legalName !== undefined ||
      value.fullName !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined ||
      value.registeredCompanyName !== undefined ||
      value.croNumber !== undefined ||
      value.businessStructure !== undefined,
    { message: 'At least one personal detail field is required' },
  );

export type SellerRegistrationKindInput = z.infer<typeof sellerRegistrationKindSchema>;
/** @deprecated Use SellerRegistrationKindInput */
export type SellerBusinessStructureInput = SellerRegistrationKindInput;
export type SellerPersonalDetailsInput = z.infer<typeof sellerPersonalDetailsSchema>;
export type SellerPersonalDetailsUpdateInput = z.infer<typeof sellerPersonalDetailsUpdateSchema>;

export function parseSellerPersonalDetails(input: unknown): SellerPersonalDetailsInput {
  return sellerPersonalDetailsSchema.parse(input);
}

export function assessPersonalDetailsNameComplete(input: {
  legalName?: string | null;
  /** @deprecated */
  fullName?: string | null;
}): boolean {
  const name = input.legalName ?? input.fullName;
  return Boolean(name?.trim());
}

export function assessBusinessDetailsCompleteness(input: {
  isBusinessAccount?: boolean;
  businessStructure?: string | null;
  registeredCompanyName?: string | null;
  croNumber?: string | null;
}): { complete: boolean; missingFields: Array<'registeredCompanyName' | 'croNumber'> } {
  const missingFields: Array<'registeredCompanyName' | 'croNumber'> = [];
  const structure = input.businessStructure;
  const isLtd = structure === 'limited_company';

  if (!isLtd) {
    return { complete: true, missingFields };
  }

  if (!input.registeredCompanyName?.trim()) {
    missingFields.push('registeredCompanyName');
  }
  if (!input.croNumber?.trim()) {
    missingFields.push('croNumber');
  }

  return { complete: missingFields.length === 0, missingFields };
}

export function assessPersonalDetailsCompleteness(input: {
  legalName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isBusinessAccount?: boolean;
  businessStructure?: string | null;
  registeredCompanyName?: string | null;
  croNumber?: string | null;
}): {
  complete: boolean;
  missingFields: Array<'legalName' | 'email' | 'phone' | 'registeredCompanyName' | 'croNumber'>;
} {
  const missingFields: Array<'legalName' | 'email' | 'phone' | 'registeredCompanyName' | 'croNumber'> =
    [];

  if (!assessPersonalDetailsNameComplete(input)) {
    missingFields.push('legalName');
  }
  if (!input.email?.trim() || !input.emailVerified) {
    missingFields.push('email');
  }
  if (!input.phone?.trim() || !input.phoneVerified) {
    missingFields.push('phone');
  }

  const business = assessBusinessDetailsCompleteness(input);
  missingFields.push(...business.missingFields);

  return { complete: missingFields.length === 0, missingFields };
}
