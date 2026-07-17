'use client';

/**
 * @deprecated Prefer `useAppFeedback()` from `@community-marketplace/ui`.
 * Kept so older imports keep compiling; new code should not use this stack.
 */

export interface VerificationToast {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

export function useVerificationToast() {
  return {
    toasts: [] as VerificationToast[],
    push: (_message: string, _type: VerificationToast['type'] = 'info') => {
      // no-op — VerificationNudgeHost uses the shared branded toast system
    },
    dismiss: (_id: number) => {
      // no-op
    },
  };
}

export function VerificationToastStack(_props: {
  toasts: VerificationToast[];
  onDismiss: (id: number) => void;
}) {
  return null;
}
