import { Injectable } from '@nestjs/common';

import type { RegisterDeviceDto } from '../dto/notifications.dto';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DeviceTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterDeviceDto) {
    const row = await this.prisma.deviceToken.upsert({
      where: { userId_token: { userId, token: dto.token } },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      },
      update: {
        platform: dto.platform,
        isActive: true,
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      token: row.token,
      platform: row.platform,
      isActive: row.isActive,
    };
  }

  async deactivate(userId: string, token: string) {
    await this.prisma.deviceToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
    return { success: true };
  }
}
