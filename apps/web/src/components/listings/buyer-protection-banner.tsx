import Link from 'next/link';

import { ShieldAlert } from 'lucide-react';

export function BuyerProtectionBanner() {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-2">
          <p className="font-medium">Community buyer protection</p>
          <ul className="list-inside list-disc space-y-1 text-green-800">
            <li>We verify sellers and listings to keep your community safe.</li>
            <li>
              <Link href="/safety" className="font-medium underline hover:text-green-950">
                Report suspicious listings instantly
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
