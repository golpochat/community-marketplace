import { z } from 'zod';

export const aiMarketingTextTaskSchema = z.enum([
  'seo_title',
  'description',
  'keywords',
  'instagram_caption',
  'facebook_ad',
  'tiktok_script',
  'whatsapp_message',
  'email_campaign',
  'seasonal_promo',
]);

export const aiMarketingTaskSchema = z.enum([
  'seo_title',
  'description',
  'keywords',
  'instagram_caption',
  'facebook_ad',
  'tiktok_script',
  'whatsapp_message',
  'email_campaign',
  'seasonal_promo',
  'image_enhance',
  'image_bg_remove',
  'banner_creator',
]);

export const aiBannerFormatSchema = z.enum([
  'feed_square',
  'story',
  'marketplace_card',
]);

export const aiBannerTemplateSchema = z.enum([
  'classic',
  'for_sale_near_you',
  'collection_only',
  'priced_to_sell',
]);

export const aiMarketingGenerateSchema = z
  .object({
    task: aiMarketingTextTaskSchema,
    listingId: z.string().uuid().optional(),
    title: z.string().trim().max(100).optional(),
    description: z.string().trim().max(5000).optional(),
    categoryName: z.string().trim().max(120).optional(),
    condition: z.string().trim().max(40).optional(),
    location: z.string().trim().max(120).optional(),
    price: z.union([z.string(), z.number()]).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.listingId && !value.title && !value.description && !value.categoryName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide listingId or at least title, description, or categoryName for context.',
      });
    }
  });

export const aiMarketingImageSchema = z
  .object({
    task: z.enum(['image_enhance', 'image_bg_remove', 'banner_creator']),
    listingId: z.string().uuid(),
    imageId: z.string().uuid(),
    bannerFormat: aiBannerFormatSchema.optional(),
    bannerTemplate: aiBannerTemplateSchema.optional(),
    includeWatermark: z.boolean().optional().default(true),
    includeStoreLogo: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.task === 'banner_creator' && !value.bannerFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bannerFormat'],
        message: 'bannerFormat is required for banner_creator.',
      });
    }
  });

export const aiMarketingApplyImageSchema = z.object({
  generationId: z.string().uuid(),
});

export const aiMarketingPriceSuggestSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    condition: z.string().trim().max(40).optional(),
    location: z.string().trim().max(120).optional(),
    make: z.string().trim().max(80).optional(),
    model: z.string().trim().max(80).optional(),
    year: z.union([z.string(), z.number()]).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.listingId && !value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide listingId or categoryId.',
      });
    }
  });

export const aiMarketingBestPostingTimeSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.listingId && !value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide listingId or categoryId.',
      });
    }
  });

export const aiMarketingCampaignPackSchema = z.object({
  listingId: z.string().uuid(),
});

export type AiMarketingGenerateInput = z.infer<typeof aiMarketingGenerateSchema>;
export type AiMarketingImageInput = z.infer<typeof aiMarketingImageSchema>;
export type AiMarketingApplyImageInput = z.infer<typeof aiMarketingApplyImageSchema>;
export type AiMarketingPriceSuggestInput = z.infer<typeof aiMarketingPriceSuggestSchema>;
export type AiMarketingBestPostingTimeInput = z.infer<
  typeof aiMarketingBestPostingTimeSchema
>;
export type AiMarketingCampaignPackInput = z.infer<
  typeof aiMarketingCampaignPackSchema
>;
