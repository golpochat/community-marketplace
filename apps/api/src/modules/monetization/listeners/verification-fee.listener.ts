import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { PlatformSettingsService } from '../services/platform-settings.service';

@Injectable()
export class VerificationFeeListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('user.verification_approved', (event) => {
      void this.applyVerifiedFee(event.payload.userId as string);
    });
  }

  private async applyVerifiedFee(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customPlatformFeePercent: true },
    });
    if (!user || user.customPlatformFeePercent != null) {
      return;
    }

    const settings = await this.settings.get();
    await this.prisma.user.update({
      where: { id: userId },
      data: { customPlatformFeePercent: settings.verifiedSellerFeePercent },
    });
  }
}
