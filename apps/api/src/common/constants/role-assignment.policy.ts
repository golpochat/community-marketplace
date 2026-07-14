import { ConflictException } from '@nestjs/common';

import { isAdminPanelRoleCode } from '@community-marketplace/types';

const MARKETPLACE_ROLE_CODES = new Set(['MEMBER', 'BUYER', 'SELLER']);

export function isMarketplaceRoleCode(code: string): boolean {
  return MARKETPLACE_ROLE_CODES.has(code);
}

export function isOperatorRoleCode(code: string): boolean {
  return code === 'SUPER_ADMIN' || isAdminPanelRoleCode(code);
}

/** Marketplace users (buyer/seller) must never be promoted to operator roles. */
export function assertNoMarketplaceToOperatorPromotion(
  currentRoleCode: string,
  targetRoleCode: string,
): void {
  if (!isMarketplaceRoleCode(currentRoleCode)) return;
  if (!isOperatorRoleCode(targetRoleCode)) return;

  throw new ConflictException(
    'Marketplace accounts cannot be promoted to operator roles. Invite a separate email address for admin access.',
  );
}
