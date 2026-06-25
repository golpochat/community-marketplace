import { z } from 'zod';

export const sharePlatformSchema = z.enum([
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'MESSENGER',
  'X',
  'TELEGRAM',
  'EMAIL',
  'COPY_LINK',
  'QR',
  'NATIVE',
]);

export const shortenListingLinkSchema = z.object({
  listingId: z.string().uuid(),
});

export const trackListingShareSchema = z.object({
  listingId: z.string().uuid(),
  platform: sharePlatformSchema,
});

export type ShortenListingLinkInput = z.infer<typeof shortenListingLinkSchema>;
export type TrackListingShareInput = z.infer<typeof trackListingShareSchema>;
