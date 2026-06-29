import type { StoreOpeningHours, StorePolicy } from '@community-marketplace/types';
import { PLATFORM_TIMEZONE } from '@community-marketplace/config/platform';

export const DEFAULT_STORE_OPENING_HOURS: StoreOpeningHours = {
  timezone: PLATFORM_TIMEZONE,
  note: 'Closed on public holidays.',
  schedule: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { closed: true },
  },
};

export const DEFAULT_STORE_POLICIES: StorePolicy = {
  returns: 'Contact the seller within 14 days if you need to discuss a return.',
  shipping: 'Collection or delivery as described on each listing.',
  responseTime: 'Typically responds within 1 business day.',
};
