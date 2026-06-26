import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { MapPin, ShieldCheck, Smartphone, Users } from 'lucide-react';

const BULLETS = [
  {
    icon: MapPin,
    title: 'Local only',
    text: 'Focus on nearby areas so you can meet sellers quickly and skip long-distance hassle.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted sellers',
    text: 'Verification, ratings, and moderation help keep scams out of your neighbourhood.',
  },
  {
    icon: Smartphone,
    title: 'Simple, fast, mobile-first',
    text: 'List in under a minute, browse on your phone, and message sellers securely.',
  },
] as const;

export function FounderStorySection() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why this exists</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Built for our local community
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Hi, I&apos;m Sujan. I built this for our local community so we can buy and sell safely
            without scams. I personally moderate listings to keep the marketplace honest, local, and
            human.
          </p>
          <Link href="/about" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Read more about our story →
          </Link>
        </div>
        <ul className="space-y-4">
          {BULLETS.map((item) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-xl border border-gray-200 bg-[hsl(var(--brand-neutral))] p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-600">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FounderCallout() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-gray-700 leading-relaxed">
          Hi, I&apos;m <strong>Sujan</strong>. I personally moderate this marketplace to keep it safe
          for our community. If something feels off, report it — I review every flag.
        </p>
      </div>
    </div>
  );
}
