import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  AI_MARKETING_DAILY_GENERATION_LIMIT,
  AI_MARKETING_FREE_UNITS_MONTHLY,
  AI_MARKETING_PROMPT_VERSION,
  AI_MARKETING_TASK_UNIT_COSTS,
  AI_MARKETING_UNIT_EUR_COST,
  isSellerVerified,
  type AiBillingMethod,
  type AiMarketingGenerateResult,
  type AiMarketingQuotaSummary,
  type AiMarketingTask,
  type SellerStatus,
} from '@community-marketplace/types';
import type { AiMarketingGenerateInput } from '@community-marketplace/validation';
import {
  LISTING_DESCRIPTION_HARD_MAX,
  LISTING_TITLE_MAX_LENGTH,
  normalizeListingTitle,
} from '@community-marketplace/utils';

import { PrismaService } from '../../../database/prisma.service';
import { AiContextAssemblerService } from './ai-context-assembler.service';
import { AiCreditMeterService } from './ai-credit-meter.service';
import { AiMarketingAccessService } from './ai-marketing-access.service';
import { AiProviderService } from './ai-provider.service';
import { AiSafetyFilterService } from './ai-safety-filter.service';

@Injectable()
export class AiGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextAssembler: AiContextAssemblerService,
    private readonly provider: AiProviderService,
    private readonly safety: AiSafetyFilterService,
    private readonly meter: AiCreditMeterService,
    private readonly access: AiMarketingAccessService,
  ) {}

  async getQuota(userId: string): Promise<AiMarketingQuotaSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerStatus: true },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const sellerVerified = isSellerVerified(user.sellerStatus as SellerStatus);
    const [freeUnitsUsedThisMonth, dailyGenerationsUsed, walletBalance, access] =
      await Promise.all([
        this.meter.countFreeUnitsUsedThisMonth(userId),
        this.meter.countGenerationsToday(userId),
        this.meter.getWalletBalance(userId),
        this.access.getStatus(),
      ]);

    const freeUnitsRemaining = sellerVerified
      ? Math.max(0, AI_MARKETING_FREE_UNITS_MONTHLY - freeUnitsUsedThisMonth)
      : 0;

    const providerReady = this.provider.isProviderReady();
    const enabled = access.effective && providerReady;

    return {
      sellerVerified,
      freeQuotaUnitsMonthly: sellerVerified ? AI_MARKETING_FREE_UNITS_MONTHLY : 0,
      freeUnitsUsedThisMonth: sellerVerified ? freeUnitsUsedThisMonth : 0,
      freeUnitsRemaining,
      walletBalance,
      unitEurCost: AI_MARKETING_UNIT_EUR_COST,
      dailyGenerationsUsed,
      dailyGenerationLimit: AI_MARKETING_DAILY_GENERATION_LIMIT,
      taskUnitCosts: { ...AI_MARKETING_TASK_UNIT_COSTS },
      enabled,
      published: access.published,
      deployEnabled: access.deployEnabled,
      imageToolsEnabled: access.effective,
      backgroundRemovalAvailable: Boolean(process.env.REMOVE_BG_API_KEY?.trim()),
    };
  }

  async generate(
    userId: string,
    input: AiMarketingGenerateInput,
  ): Promise<AiMarketingGenerateResult> {
    await this.access.assertEffective();
    if (!this.provider.isProviderReady()) {
      throw new ServiceUnavailableException(
        'AI Marketing Hub is temporarily unavailable.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerStatus: true },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const sellerVerified = isSellerVerified(user.sellerStatus as SellerStatus);
    const dailyUsed = await this.meter.countGenerationsToday(userId);
    if (dailyUsed >= AI_MARKETING_DAILY_GENERATION_LIMIT) {
      throw new ForbiddenException(
        `Daily AI generation limit reached (${AI_MARKETING_DAILY_GENERATION_LIMIT}). Try again tomorrow.`,
      );
    }

    const context = await this.contextAssembler.assemble(userId, input);
    this.safety.assertSafeContext(context);

    const creditUnits = AI_MARKETING_TASK_UNIT_COSTS[input.task];
    const freeUnitsUsed = await this.meter.countFreeUnitsUsedThisMonth(userId);
    const freeRemaining = sellerVerified
      ? Math.max(0, AI_MARKETING_FREE_UNITS_MONTHLY - freeUnitsUsed)
      : 0;

    let billingMethod: AiBillingMethod;
    let amountEur = 0;

    if (freeRemaining >= creditUnits) {
      billingMethod = 'free_quota';
    } else {
      billingMethod = 'wallet';
      amountEur = Number((creditUnits * AI_MARKETING_UNIT_EUR_COST).toFixed(2));
      const balance = await this.meter.getWalletBalance(userId);
      if (balance < amountEur) {
        if (!sellerVerified) {
          throw new ForbiddenException(
            'Free AI generations are for verified sellers. Complete verification or top up SellNearby Credit to continue.',
          );
        }
        throw new ForbiddenException(
          `Not enough SellNearby Credit. This generation costs €${amountEur.toFixed(2)}. Your balance is €${balance.toFixed(2)}.`,
        );
      }
    }

    const raw = await this.provider.generateText({
      task: input.task,
      context,
    });
    const text = this.normalizeOutput(input.task, raw);
    this.safety.assertSafeOutput(text);

    const { generationId, walletBalance, freeUnitsRemaining } =
      await this.meter.recordGeneration({
        userId,
        listingId: context.listingId,
        task: input.task,
        provider: this.provider.providerName,
        model: this.provider.modelName,
        promptVersion: AI_MARKETING_PROMPT_VERSION,
        billingMethod,
        creditUnits,
        amountEur,
        inputSummary: this.contextAssembler.summarize(context),
        outputText: text,
      });

    return {
      task: input.task,
      text,
      billingMethod,
      creditUnits,
      amountEur,
      walletBalance,
      freeUnitsRemaining,
      provider: this.provider.providerName,
      model: this.provider.modelName,
      generationId,
    };
  }

  private normalizeOutput(task: AiMarketingTask, raw: string): string {
    const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
    if (task === 'seo_title') {
      return normalizeListingTitle(cleaned).slice(0, LISTING_TITLE_MAX_LENGTH);
    }
    if (task === 'keywords') {
      return cleaned
        .replace(/^keywords?:\s*/i, '')
        .replace(/\n+/g, ', ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/#+/g, '')
        .slice(0, 500);
    }
    if (
      task === 'instagram_caption' ||
      task === 'facebook_ad' ||
      task === 'whatsapp_message' ||
      task === 'seasonal_promo'
    ) {
      return cleaned.slice(0, 2200);
    }
    if (task === 'tiktok_script' || task === 'email_campaign') {
      return cleaned.slice(0, 3000);
    }
    return cleaned.slice(0, LISTING_DESCRIPTION_HARD_MAX);
  }
}
