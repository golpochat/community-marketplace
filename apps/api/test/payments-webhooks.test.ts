import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentsWebhooksController } from '../src/modules/payments/payments-webhooks.controller';
import { PaymentsWebhooksService } from '../src/modules/payments/services/payments-webhooks.service';

const ENV_KEYS = ['NODE_ENV', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const;

function snapshotEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

function requestWithBody(raw: string | Buffer | undefined): RawBodyRequest<Request> {
  return { rawBody: raw === undefined ? undefined : Buffer.from(raw) } as RawBodyRequest<Request>;
}

function stripeEvent(id: string, type = 'radar.early_fraud_warning.created'): Stripe.Event {
  return {
    id,
    type,
    data: { object: {} },
  } as Stripe.Event;
}

function silentLogger() {
  return { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() };
}

function createController(handleEvent = vi.fn()) {
  return new PaymentsWebhooksController({ handleEvent } as never, silentLogger() as never);
}

function createService(opts: {
  claim: ReturnType<typeof vi.fn>;
  release?: ReturnType<typeof vi.fn>;
  payment?: { findFirst: ReturnType<typeof vi.fn> };
}) {
  return new PaymentsWebhooksService(
    {
      claim: opts.claim,
      release: opts.release ?? vi.fn(),
    } as never,
    silentLogger() as never,
    {
      payment: opts.payment ?? { findFirst: vi.fn(), findUnique: vi.fn() },
    } as never,
    {} as never,
    {
      finalizeSuccessfulPayment: vi.fn().mockRejectedValue(new Error('finalize failed')),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      handlePaymentIntentSucceeded: vi.fn(),
    } as never,
  );
}

describe('Stripe webhook signature', () => {
  const env = snapshotEnv();

  afterEach(() => {
    restoreEnv(env);
  });

  it('rejects a missing raw body', async () => {
    const handleEvent = vi.fn();
    const controller = createController(handleEvent);
    await expect(controller.handleStripeWebhook(requestWithBody(undefined))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it('requires Stripe config in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const handleEvent = vi.fn();
    const controller = createController(handleEvent);
    await expect(
      controller.handleStripeWebhook(requestWithBody('{}'), 't=1,v1=abc'),
    ).rejects.toMatchObject({ message: 'Stripe webhook verification is not configured' });
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it('requires a signature in production when Stripe is configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const handleEvent = vi.fn();
    const controller = createController(handleEvent);
    await expect(controller.handleStripeWebhook(requestWithBody('{}'))).rejects.toMatchObject({
      message: 'Stripe webhook signature is required in production',
    });
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it('rejects an invalid Stripe signature', async () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const handleEvent = vi.fn();
    const controller = createController(handleEvent);
    await expect(
      controller.handleStripeWebhook(requestWithBody('{"id":"evt_1"}'), 't=1,v1=not-a-real-signature'),
    ).rejects.toMatchObject({ message: 'Invalid Stripe webhook signature' });
    expect(handleEvent).not.toHaveBeenCalled();
  });
});

describe('Stripe webhook event claim', () => {
  it('claims a new event and reports duplicates on retry', async () => {
    const claim = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const service = createService({ claim });

    const event = stripeEvent('evt_claim_1');
    await expect(service.handleEvent(event)).resolves.toEqual({ duplicate: false });
    await expect(service.handleEvent(event)).resolves.toEqual({ duplicate: true });
    expect(claim).toHaveBeenCalledTimes(2);
  });

  it('releases the claim when the handler throws so Stripe can retry', async () => {
    const claim = vi.fn().mockResolvedValue(true);
    const release = vi.fn().mockResolvedValue(undefined);
    const findFirst = vi.fn().mockResolvedValue({ id: 'pay_1' });
    const service = createService({
      claim,
      release,
      payment: { findFirst },
    });

    await expect(
      service.handleEvent({
        id: 'evt_fail_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      } as Stripe.Event),
    ).rejects.toThrow('finalize failed');

    expect(release).toHaveBeenCalledWith('evt_fail_1');
  });
});
