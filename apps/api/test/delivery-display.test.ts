import { describe, expect, it } from 'vitest';

import {
  buildDeliverySummaryLabel,
  deliverySectionTitle,
  sanitizeDeliveryOptionsForDisplay,
} from '@community-marketplace/utils';

describe('delivery display helpers', () => {
  it('sanitizes Collection + shipping to shipping only', () => {
    const options = [
      { zone: 'COLLECTION' as const },
      { zone: 'NATIONAL' as const },
    ];
    expect(sanitizeDeliveryOptionsForDisplay(options)).toEqual([{ zone: 'NATIONAL' }]);
    expect(buildDeliverySummaryLabel(options)).toBe('Delivery available');
    expect(deliverySectionTitle(options)).toBe('Delivery');
  });

  it('keeps collection-only', () => {
    const options = [{ zone: 'COLLECTION' as const }];
    expect(sanitizeDeliveryOptionsForDisplay(options)).toEqual(options);
    expect(deliverySectionTitle(options)).toBe('Collection');
    expect(buildDeliverySummaryLabel(options)).toBe('Collection only');
  });
});
