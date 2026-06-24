import { Injectable, NotFoundException } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { BanEntity } from '../entities/ban.entity';
import type { CreateBanDto, LiftBanDto } from '../dto/moderation.dto';

@Injectable()
export class BansService {
  private readonly bans = new Map<string, BanEntity>();

  constructor(private readonly eventBus: EventBusService) {}

  create(moderatorId: string, dto: CreateBanDto): BanEntity {
    const ban = new BanEntity();
    ban.id = `ban-${Date.now()}`;
    ban.userId = dto.userId;
    ban.bannedBy = moderatorId;
    ban.type = dto.type;
    ban.scope = dto.scope;
    ban.reason = dto.reason;
    ban.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    ban.isActive = true;
    ban.createdAt = new Date();
    ban.updatedAt = new Date();

    this.bans.set(ban.id, ban);

    this.eventBus.publish({
      type: 'moderation.user_banned',
      payload: { banId: ban.id, userId: dto.userId },
      timestamp: new Date(),
    });

    return ban;
  }

  findAll(): BanEntity[] {
    return [...this.bans.values()].filter((b) => b.isActive);
  }

  findByUser(userId: string): BanEntity[] {
    return [...this.bans.values()].filter((b) => b.userId === userId && b.isActive);
  }

  lift(banId: string, moderatorId: string, dto: LiftBanDto): BanEntity {
    const ban = this.bans.get(banId);
    if (!ban) {
      throw new NotFoundException(`Ban ${banId} not found`);
    }

    ban.isActive = false;
    ban.updatedAt = new Date();

    this.eventBus.publish({
      type: 'moderation.ban_lifted',
      payload: { banId, userId: ban.userId, moderatorId, reason: dto.reason },
      timestamp: new Date(),
    });

    return ban;
  }

  isUserBanned(userId: string): boolean {
    return this.findByUser(userId).some(
      (ban) => ban.type === 'permanent' || (ban.expiresAt && ban.expiresAt > new Date()),
    );
  }
}
