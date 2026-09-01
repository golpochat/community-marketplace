import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { CashbackGrantsService } from '../services/cashback-grants.service';

@Injectable()
export class CashbackEventsListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly grants: CashbackGrantsService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('payment.succeeded', (event) => {
      const paymentId = event.payload.paymentId as string | undefined;
      if (paymentId) {
        void this.grants.createPendingGrantForPayment(paymentId);
      }
    });

    const cancel = (payload: Record<string, unknown>) => {
      const paymentId = payload.paymentId as string | undefined;
      if (paymentId) {
        void this.grants.cancelGrantsForPayment(paymentId);
      }
    };

    this.eventBus.subscribe('payment.refunded', (event) => cancel(event.payload));
    this.eventBus.subscribe('payment.disputed', (event) => cancel(event.payload));
  }
}
