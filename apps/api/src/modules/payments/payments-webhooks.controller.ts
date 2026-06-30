import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
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
  private readonly logger = new Logger(PaymentsWebhooksController.name);
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
    const isProduction = process.env.NODE_ENV === 'production';

    if (!rawBody) {
      throw new BadRequestException('Missing raw body for webhook verification');
    }

    if (isProduction && (!this.stripe || !webhookSecret)) {
      throw new BadRequestException('Stripe webhook verification is not configured');
    }

    let event: Stripe.Event;

    if (this.stripe && webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (error) {
        this.logger.error('Stripe webhook signature verification failed', error);
        throw new BadRequestException('Invalid Stripe webhook signature');
      }
    } else if (isProduction) {
      throw new BadRequestException('Stripe webhook signature is required in production');
    } else {
      event = JSON.parse(rawBody.toString('utf8')) as Stripe.Event;
    }

    try {
      const result = await this.webhooks.handleEvent(event);
      return result;
    } catch (error) {
      this.logger.error(`Stripe webhook handler failed for ${event.type} (${event.id})`, error);
      throw error;
    }
  }
}
