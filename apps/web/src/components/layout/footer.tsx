import Link from 'next/link';

import { APP_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-semibold text-gray-900">{APP_NAME}</p>
            <p className="mt-2 text-sm text-gray-500">
              Your local marketplace for {PLATFORM_COUNTRY_NAME}.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Marketplace</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>
                <Link href="/listings" className="hover:text-gray-900">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-gray-900">
                  Start selling
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Support</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-gray-900">
                  Help centre
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  About us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Account</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>
                <Link href="/auth/login" className="hover:text-gray-900">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-gray-900">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {APP_NAME} · {PLATFORM_COUNTRY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
