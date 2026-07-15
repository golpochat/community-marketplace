import { describe, expect, it } from 'vitest';

import {
  cleanPilotListingTitle,
} from '../src/database/clean-pilot-listing-titles';

describe('cleanPilotListingTitle', () => {
  it('strips pilot prefix and duplicate suffix', () => {
    expect(cleanPilotListingTitle('[Pilot] IKEA Billy Bookcase (White) #5')).toBe(
      'IKEA Billy Bookcase (White)',
    );
  });

  it('strips pilot prefix only when no duplicate suffix', () => {
    expect(cleanPilotListingTitle('[Pilot] Samsung Galaxy A54')).toBe('Samsung Galaxy A54');
  });

  it('returns null for non-pilot titles', () => {
    expect(cleanPilotListingTitle('IKEA Billy Bookcase (White)')).toBeNull();
  });
});
