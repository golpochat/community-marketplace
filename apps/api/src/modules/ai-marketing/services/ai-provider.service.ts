import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { AiMarketingTask } from '@community-marketplace/types';
import {
  LISTING_DESCRIPTION_SOFT_MAX,
  LISTING_TITLE_MAX_LENGTH,
} from '@community-marketplace/utils';

import type { AiListingContext } from './ai-context-assembler.service';

const TASK_LABELS: Record<AiMarketingTask, string> = {
  seo_title: 'SEO title',
  description: 'product description',
  keywords: 'keywords / tags',
  instagram_caption: 'Instagram caption',
  facebook_ad: 'Facebook marketplace / post copy',
  tiktok_script: 'TikTok short-form script',
  whatsapp_message: 'WhatsApp promo message',
  email_campaign: 'email campaign draft',
  seasonal_promo: 'seasonal promotion copy',
  image_enhance: 'image enhance',
  image_bg_remove: 'background remove',
  banner_creator: 'share banner',
  store_banner: 'shop banner',
};

const PROVIDER_TIMEOUT_MS = 30_000;

export type AiTextProviderId = 'openai' | 'anthropic' | 'stub';

export interface AiTextGenerationResult {
  text: string;
  provider: AiTextProviderId;
  model: string;
  usedFallback: boolean;
}

type LiveProviderId = 'openai' | 'anthropic';

interface LiveProviderConfig {
  id: LiveProviderId;
  model: string;
  apiKey: string;
}

/** Ordered live text providers: OpenAI primary, Anthropic fallback when keyed. */
export function resolveLiveTextProviders(
  env: NodeJS.ProcessEnv = process.env,
): LiveProviderConfig[] {
  const providers: LiveProviderConfig[] = [];
  const openaiKey = env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    providers.push({
      id: 'openai',
      model: env.OPENAI_CHAT_MODEL?.trim() || 'gpt-4o-mini',
      apiKey: openaiKey,
    });
  }
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    providers.push({
      id: 'anthropic',
      model: env.ANTHROPIC_CHAT_MODEL?.trim() || 'claude-haiku-4-5',
      apiKey: anthropicKey,
    });
  }
  return providers;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  /** Preferred / primary provider for readiness display (not necessarily last used). */
  get providerName(): AiTextProviderId {
    const live = resolveLiveTextProviders();
    if (live[0]) return live[0].id;
    return 'stub';
  }

  get modelName(): string {
    const live = resolveLiveTextProviders();
    if (live[0]) return live[0].model;
    return 'dev-stub';
  }

  /** True when text generation can run (any live key or non-prod stub). Ignores admin publish. */
  isProviderReady(): boolean {
    if (resolveLiveTextProviders().length > 0) return true;
    return process.env.NODE_ENV !== 'production';
  }

  /** @deprecated Prefer access service + isProviderReady. Kept for internal generateText guard. */
  isEnabled(): boolean {
    if (process.env.AI_MARKETING_ENABLED === 'false') return false;
    return this.isProviderReady();
  }

  async generateText(input: {
    task: AiMarketingTask;
    context: AiListingContext;
  }): Promise<AiTextGenerationResult> {
    if (!this.isProviderReady()) {
      throw new ServiceUnavailableException(
        'AI Marketing Hub is temporarily unavailable.',
      );
    }

    const live = resolveLiveTextProviders();
    if (live.length === 0) {
      return {
        text: this.stubText(input.task, input.context),
        provider: 'stub',
        model: 'dev-stub',
        usedFallback: false,
      };
    }

    const system = this.systemPrompt(input.task);
    const user = this.userPrompt(input.task, input.context);
    const maxTokens = this.maxTokensFor(input.task);
    const temperature =
      input.task === 'seo_title' || input.task === 'keywords' ? 0.5 : 0.7;

    const errors: string[] = [];
    for (let index = 0; index < live.length; index += 1) {
      const candidate = live[index]!;
      try {
        const text =
          candidate.id === 'openai'
            ? await this.callOpenAi({
                apiKey: candidate.apiKey,
                model: candidate.model,
                system,
                user,
                maxTokens,
                temperature,
              })
            : await this.callAnthropic({
                apiKey: candidate.apiKey,
                model: candidate.model,
                system,
                user,
                maxTokens,
                temperature,
              });
        const usedFallback = index > 0;
        if (usedFallback) {
          this.logger.warn(
            `Primary text provider failed; used fallback ${candidate.id}/${candidate.model}`,
          );
        }
        return {
          text,
          provider: candidate.id,
          model: candidate.model,
          usedFallback,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown provider error';
        errors.push(`${candidate.id}: ${message}`);
        this.logger.warn(
          `Text provider ${candidate.id} failed (${message})${
            index < live.length - 1 ? '; trying fallback' : ''
          }`,
        );
      }
    }

    this.logger.error(`All text providers failed: ${errors.join('; ')}`);
    throw new ServiceUnavailableException(
      'AI provider failed. Please try again shortly.',
    );
  }

  private async callOpenAi(input: {
    apiKey: string;
    model: string;
    system: string;
    user: string;
    maxTokens: number;
    temperature: number;
  }): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('empty content');
    }
    return content;
  }

  private async callAnthropic(input: {
    apiKey: string;
    model: string;
    system: string;
    user: string;
    maxTokens: number;
    temperature: number;
  }): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': input.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        system: input.system,
        messages: [{ role: 'user', content: input.user }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const content = json.content
      ?.filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text!.trim())
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!content) {
      throw new Error('empty content');
    }
    return content;
  }

  private maxTokensFor(task: AiMarketingTask): number {
    switch (task) {
      case 'seo_title':
        return 80;
      case 'keywords':
        return 120;
      case 'whatsapp_message':
      case 'seasonal_promo':
        return 220;
      case 'instagram_caption':
      case 'facebook_ad':
        return 280;
      case 'tiktok_script':
      case 'email_campaign':
        return 450;
      case 'description':
      default:
        return 600;
    }
  }

  private systemPrompt(task: AiMarketingTask): string {
    const base =
      'You write marketplace listing copy for SellNearby.ie, an Irish community marketplace. ' +
      'Use Irish English spelling and tone (e.g. colour, metre, organised). ' +
      'Be honest, clear, and buyer-friendly. Do not invent specs, warranties, or condition details not provided. ' +
      'Never mention competitors. Never claim guaranteed sales or ROAS. ' +
      'Prefer local collection / community marketplace framing over shipping-first language unless delivery is stated.';

    switch (task) {
      case 'seo_title':
        return (
          `${base} Return only one SEO-friendly listing title. ` +
          `Max ${LISTING_TITLE_MAX_LENGTH} characters. No quotes or hashtags.`
        );
      case 'description':
        return (
          `${base} Return only the listing description body. ` +
          `Aim for under ${LISTING_DESCRIPTION_SOFT_MAX} characters. Use short paragraphs. ` +
          'Include condition, what is included, and pickup/location cues when known. No markdown headings.'
        );
      case 'keywords':
        return (
          `${base} Return 8–12 short search keywords/tags for the listing, comma-separated on one line. ` +
          'No hashtags. No sentences. Prefer buyer search terms used in Ireland.'
        );
      case 'instagram_caption':
        return (
          `${base} Return only one Instagram caption for promoting this listing. ` +
          '2–4 short lines, friendly tone, include a clear CTA to message on SellNearby. ' +
          'End with 3–6 relevant hashtags. No emoji spam (0–3 emojis max).'
        );
      case 'facebook_ad':
        return (
          `${base} Return Facebook Marketplace / feed post copy only. ` +
          'Include a strong first line, 2–4 short supporting lines, price/location cues when known, ' +
          'and a CTA to contact via SellNearby. No hashtag walls. No markdown.'
        );
      case 'tiktok_script':
        return (
          `${base} Return a short TikTok talking script only (15–30 seconds). ` +
          'Use this structure with plain labels: Hook / Body / CTA. ' +
          'Conversational spoken Irish English. Mention local pickup when location is known. ' +
          'Keep under 90 words. No hashtags in the script body.'
        );
      case 'whatsapp_message':
        return (
          `${base} Return one short WhatsApp message a seller can forward to buyers or local groups. ` +
          'Max 4 short lines. Friendly and direct. Include item, price/location if known, and CTA to reply or view on SellNearby. ' +
          'No hashtags. Minimal emojis (0–2).'
        );
      case 'email_campaign':
        return (
          `${base} Return an email campaign draft only, with plain labels: Subject / Preview / Body. ` +
          'Subject under 60 characters. Body 3–6 short paragraphs or lines. Irish English. ' +
          'CTA to view the listing on SellNearby. No HTML.'
        );
      case 'seasonal_promo':
        return (
          `${base} Return short seasonal promotion copy for this listing, suited to the current season in Ireland ` +
          '(infer from context; default to a timely local angle such as back-to-school, Christmas, spring clear-out, or summer). ' +
          '2–4 short lines plus one CTA. Do not invent discounts unless price context implies one. No hashtag walls.'
        );
      default:
        return base;
    }
  }

  private userPrompt(task: AiMarketingTask, context: AiListingContext): string {
    const lines = [
      `Task: ${TASK_LABELS[task]}`,
      context.title ? `Current title: ${context.title}` : null,
      context.description ? `Current description: ${context.description}` : null,
      `Category: ${context.categoryName}`,
      `Condition: ${context.condition}`,
      `Location: ${context.location}`,
      context.priceLabel ? `Price: ${context.priceLabel}` : null,
      context.storeName ? `Store: ${context.storeName}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private stubText(task: AiMarketingTask, context: AiListingContext): string {
    const item = context.title || context.categoryName || 'item';
    const place = context.location || 'your area';

    switch (task) {
      case 'seo_title': {
        const title = `${item} — ${context.condition} condition in ${place}`;
        return title.slice(0, LISTING_TITLE_MAX_LENGTH);
      }
      case 'keywords':
        return [
          item,
          context.categoryName,
          context.condition,
          place,
          'for sale',
          'local collection',
          'SellNearby',
          context.priceLabel ? 'bargain' : 'marketplace',
        ]
          .filter(Boolean)
          .join(', ');
      case 'instagram_caption':
        return [
          `${item} ready for collection in ${place}.`,
          context.priceLabel ? `Asking ${context.priceLabel}.` : '',
          'Message me on SellNearby if you are interested.',
          `#SellNearby #Ireland #${context.categoryName.replace(/\s+/g, '')} #LocalFind #ForSale`,
        ]
          .filter(Boolean)
          .join('\n\n');
      case 'facebook_ad':
        return [
          `${item} for sale — ${context.condition} condition`,
          context.priceLabel ? `Price: ${context.priceLabel}` : '',
          `Collection in ${place}.`,
          'Message on SellNearby to arrange viewing.',
        ]
          .filter(Boolean)
          .join('\n');
      case 'tiktok_script':
        return [
          `Hook: Looking for a ${item.toLowerCase()} near ${place}?`,
          `Body: It's in ${context.condition} condition${
            context.priceLabel ? ` and priced at ${context.priceLabel}` : ''
          }. Local collection on SellNearby.`,
          'CTA: Message me on SellNearby before it goes.',
        ].join('\n');
      case 'whatsapp_message':
        return [
          `Hi — ${item} still available in ${place}.`,
          context.priceLabel ? `Price ${context.priceLabel}.` : '',
          'Happy to arrange collection. Reply here or message on SellNearby.',
        ]
          .filter(Boolean)
          .join('\n');
      case 'email_campaign':
        return [
          `Subject: ${item} available near ${place}`,
          'Preview: Local SellNearby listing ready for collection',
          '',
          'Body:',
          `Hi there,`,
          '',
          `I've listed ${item} in ${context.condition} condition${
            context.priceLabel ? ` for ${context.priceLabel}` : ''
          }.`,
          `Collection in ${place}.`,
          '',
          'View it on SellNearby and message me if interested.',
        ].join('\n');
      case 'seasonal_promo':
        return [
          `Seasonal clear-out: ${item} in ${place}.`,
          context.priceLabel ? `Now ${context.priceLabel}.` : 'Priced to sell.',
          'Message on SellNearby to arrange collection this week.',
        ].join('\n');
      case 'description':
      default:
        return [
          `Selling this ${item.toLowerCase()} in ${context.condition} condition.`,
          `Located in ${place}. Local collection welcome.`,
          context.priceLabel ? `Asking ${context.priceLabel}.` : '',
          'Happy to answer questions — message me on SellNearby.',
        ]
          .filter(Boolean)
          .join('\n\n');
    }
  }
}
