import { Injectable } from '@nestjs/common';

import { LoggerLib } from '../libs/logger.lib';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class EventBusService {
  private handlers = new Map<string, Array<(event: DomainEvent) => void>>();

  constructor(private readonly logger: LoggerLib) {}

  publish(event: DomainEvent) {
    this.logger.log('EventBus', `Publishing ${event.type}`);
    const handlers = this.handlers.get(event.type) ?? [];
    handlers.forEach((handler) => handler(event));
  }

  subscribe(type: string, handler: (event: DomainEvent) => void) {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }
}
