import { z } from 'zod';

import { uuidSchema } from './common.schema';

export const listingReserveWindowHoursSchema = z.union([
  z.literal(4),
  z.literal(12),
  z.literal(24),
]);

export const createListingReserveSchema = z.object({
  listingId: uuidSchema,
});

export type CreateListingReserveInput = z.infer<typeof createListingReserveSchema>;
