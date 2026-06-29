'use client';

import { Button } from '@community-marketplace/ui';

export function OfflineRetryButton() {
  return (
    <Button type="button" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
