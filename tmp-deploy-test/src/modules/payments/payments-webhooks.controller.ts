import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';

import { Public } from '../../common/decorators/public.decorator';
import { PaymentsWebhooksService } from './services/payments-webhooks.service';

@Controller('payments/webhooks')
export class PaymentsWebhooksController {
  private readonly stripe: Stripe | null;

  constructor(private readonly webhooks: PaymentsWebhooksService) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = apiKey ? new Stripe(apiKey) : null;
  }

  @Public()
  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Missing raw body for webhook verification');
    }

    let event: Stripe.Event;

    if (this.stripe && webhookSecret && signature) {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = JSON.parse(rawBody.toString('utf8')) as Stripe.Event;
    }

    return this.webhooks.handleEvent(event);
  }
}
