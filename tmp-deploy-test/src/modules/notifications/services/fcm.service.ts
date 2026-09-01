import { Injectable } from '@nestjs/common';

import { LoggerLib } from '../../../libs/logger.lib';
import { DeviceTokenEntity } from '../entities/device-token.entity';
import type { RegisterDeviceDto } from '../dto/notifications.dto';

export interface FcmPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService {
  constructor(private readonly logger: LoggerLib) {}

  async sendToDevice(token: string, payload: FcmPushPayload): Promise<{ success: boolean }> {
    // Replace with firebase-admin integration in production
    this.logger.log('FcmService', `Push to ${token.slice(0, 12)}... — ${payload.title}`);
    return { success: true };
  }

  async sendToDevices(tokens: string[], payload: FcmPushPayload): Promise<{ sent: number }> {
    await Promise.all(tokens.map((token) => this.sendToDevice(token, payload)));
    return { sent: tokens.length };
  }
}

@Injectable()
export class DeviceTokenService {
  private readonly tokens = new Map<string, DeviceTokenEntity[]>();

  register(userId: string, dto: RegisterDeviceDto): DeviceTokenEntity {
    const device = new DeviceTokenEntity();
    device.id = `device-${Date.now()}`;
    device.userId = userId;
    device.token = dto.token;
    device.platform = dto.platform;
    device.isActive = true;
    device.createdAt = new Date();
    device.updatedAt = new Date();

    const existing = this.tokens.get(userId) ?? [];
    this.tokens.set(userId, [...existing.filter((t) => t.token !== dto.token), device]);
    return device;
  }

  getActiveTokens(userId: string): string[] {
    return (this.tokens.get(userId) ?? [])
      .filter((t) => t.isActive)
      .map((t) => t.token);
  }
}
