'use client';

import { VerificationModal } from './verification/verification-modal';

interface SellerVerificationModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  /** Hard-stop modal when seller must verify before listing (6th attempt). */
  dismissible?: boolean;
}

export function SellerVerificationModal({
  open,
  onClose,
  message,
  dismissible = true,
}: SellerVerificationModalProps) {
  return (
    <VerificationModal
      open={open}
      onClose={onClose}
      message={message}
      dismissible={dismissible}
    />
  );
}

export { VerificationModal };
