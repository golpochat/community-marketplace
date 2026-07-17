import { Module, forwardRef } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DevUploadModule } from '../dev-upload/dev-upload.module';
import { ListingsModule } from '../listings/listings.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { UsersModule } from '../users/users.module';
import { SellerAiMarketingController } from './seller-ai-marketing.controller';
import { AiContextAssemblerService } from './services/ai-context-assembler.service';
import { AiCreditMeterService } from './services/ai-credit-meter.service';
import { AiGenerationService } from './services/ai-generation.service';
import { AiImageService } from './services/ai-image.service';
import { AiMarketingAccessService } from './services/ai-marketing-access.service';
import { AiBestPostingTimeService } from './services/ai-best-posting-time.service';
import { AiCampaignPackService } from './services/ai-campaign-pack.service';
import { AiPriceSuggestionService } from './services/ai-price-suggestion.service';
import { AiProviderService } from './services/ai-provider.service';
import { AiSafetyFilterService } from './services/ai-safety-filter.service';

@Module({
  imports: [
    DatabaseModule,
    DevUploadModule,
    UsersModule,
    MonetizationModule,
    forwardRef(() => ListingsModule),
  ],
  controllers: [SellerAiMarketingController],
  providers: [
    AiMarketingAccessService,
    AiGenerationService,
    AiImageService,
    AiPriceSuggestionService,
    AiBestPostingTimeService,
    AiCampaignPackService,
    AiContextAssemblerService,
    AiCreditMeterService,
    AiProviderService,
    AiSafetyFilterService,
  ],
  exports: [
    AiGenerationService,
    AiImageService,
    AiPriceSuggestionService,
    AiBestPostingTimeService,
    AiCampaignPackService,
  ],
})
export class AiMarketingModule {}
