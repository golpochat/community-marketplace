import { ForbiddenException } from '@nestjs/common';

import type { UserStatus } from '@community-marketplace/types';

export function isAuthenticationBlockedStatus(status: UserStatus | string): boolean {
  return status === 'suspended' || status === 'inactive';
}

export function assertUserCanAuthenticate(status: UserStatus | string): void {
  if (status === 'suspended') {
    throw new ForbiddenException('Account is suspended');
  }

  if (status === 'inactive') {
    throw new ForbiddenException('Account is deactivated');
  }
}
