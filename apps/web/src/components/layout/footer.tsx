import Link from 'next/link';

import { APP_SHORT_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

import { Logo } from '@/components/brand/logo';

const FOOTER_LINKS = {
  marketplace: [
    { href: '/listings', label: 'Browse listings' },
    { href: '/auth/register?intent=seller', label: 'Start selling' },
    { href: '/guides', label: 'Selling guides' },
    { href: '/local', label: 'Sell by county' },
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
    { href: '/policies/prohibited-items', label: 'Prohibited items' },
  ],
  account: [
    { href: '/auth/login', label: 'Sign in' },
    { href: '/auth/register', label: 'Register' },
    { href: '/onboarding', label: 'Getting started' },
  ],
} as const;

const FOOTER_LINK_CLASS =
  'text-stone-300 transition-colors duration-150 hover:text-white';

export function Footer() {
  return (
    <footer className="bg-[hsl(var(--brand-primary-dark))] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Logo size="footer" variant="dark" linked={false} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-300">
              Ireland&apos;s trusted community marketplace for {PLATFORM_COUNTRY_NAME}. Trade locally,
              safely — with transparent optional boosts when you want more reach.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Marketplace</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.marketplace.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Legal &amp; account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-center text-sm text-stone-400">
          © {new Date().getFullYear()} {APP_SHORT_NAME} · {PLATFORM_COUNTRY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
