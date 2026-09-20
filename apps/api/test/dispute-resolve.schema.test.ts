import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { adminResolveDisputeSchema } from '@community-marketplace/validation';

describe('adminResolveDisputeSchema', () => {
  it('requires confirmCardRefund when favouring the buyer', () => {
    expect(() =>
      adminResolveDisputeSchema.parse({
        outcome: 'resolved_buyer_favored',
        resolutionNotes: 'Item not received',
      }),
    ).toThrow(ZodError);

    expect(
      adminResolveDisputeSchema.parse({
        outcome: 'resolved_buyer_favored',
        resolutionNotes: 'Item not received',
        confirmCardRefund: true,
      }).confirmCardRefund,
    ).toBe(true);
  });

  it('rejects a card refund confirm unless the buyer is favoured', () => {
    expect(() =>
      adminResolveDisputeSchema.parse({
        outcome: 'resolved_seller_favored',
        resolutionNotes: 'Item as described',
        confirmCardRefund: true,
      }),
    ).toThrow(ZodError);

    expect(
      adminResolveDisputeSchema.parse({
        outcome: 'closed',
        resolutionNotes: 'Opened in error',
      }).outcome,
    ).toBe('closed');
  });
});
