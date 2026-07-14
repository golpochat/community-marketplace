import { z } from 'zod';

import { sellerRegistrationKindSchema } from './auth.schema';

export const startSellerOnboardingSchema = z.object({
  sellerKind: sellerRegistrationKindSchema,
});

export type StartSellerOnboardingInput = z.infer<typeof startSellerOnboardingSchema>;
