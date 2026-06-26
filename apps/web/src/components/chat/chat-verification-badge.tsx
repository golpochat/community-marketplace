'use client';

interface ChatVerificationBadgeProps {
  verified: boolean;
  role: string;
}

export function ChatVerificationBadge({ verified, role }: ChatVerificationBadgeProps) {
  if (role !== 'SELLER') return null;

  if (verified) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Verified Seller
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Unverified Seller
    </span>
  );
}
