import Link from 'next/link';

import { APP_SHORT_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

import { Logo } from '@/components/brand/logo';

const FOOTER_LINKS = {
  marketplace: [
    { href: '/listings', label: 'Browse listings' },
    { href: '/auth/register?intent=seller', label: 'Start selling' },
    { href: '/success-stories', label: 'Success stories' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/safety', label: 'Safety & scam protection' },
    { href: '/community-rules', label: 'Community rules' },
    { href: '/help', label: 'Help' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
  ],
  account: [
    { href: '/auth/login', label: 'Sign in' },
    { href: '/auth/register', label: 'Register' },
    { href: '/onboarding', label: 'Getting started' },
  ],
} as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="footer" className="pointer-events-none" />
            <p className="mt-3 text-sm text-gray-500">
              Ireland&apos;s trusted community marketplace for {PLATFORM_COUNTRY_NAME}.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">Marketplace</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {FOOTER_LINKS.marketplace.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">Legal &amp; account</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {APP_SHORT_NAME} · {PLATFORM_COUNTRY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
