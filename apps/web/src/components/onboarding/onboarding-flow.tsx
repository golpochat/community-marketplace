'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input, Label } from '@community-marketplace/ui';
import { CheckCircle2, Circle } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';

const STEPS = [
  {
    id: 'photo',
    title: 'Add a profile photo',
    description: 'Optional — helps neighbours recognise you.',
    href: '/seller/settings',
  },
  {
    id: 'location',
    title: 'Confirm your area',
    description: 'So we can show listings near you.',
    href: '/seller/settings',
  },
  {
    id: 'list',
    title: 'Post your first item',
    description: 'List your first item in under 1 minute.',
    href: '/seller/listings/create',
    cta: 'List your first item in under 1 minute',
  },
] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-primary/20 bg-white p-6 shadow-brand-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Welcome</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {user?.displayName ? `Hi ${user.displayName.split(' ')[0]},` : 'Hi there,'} let&apos;s get
          you started
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your phone number is verified to protect the community. Complete these quick steps — or skip
          and come back anytime.
        </p>

        <ol className="mt-6 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.id} className="flex gap-3 rounded-lg border border-gray-100 p-4">
              <span className="mt-0.5 text-primary">
                {index === 0 ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" aria-hidden />
                )}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600">{step.description}</p>
                {step.id === 'location' && (
                  <Input
                    className="mt-2"
                    placeholder="e.g. Goatstown, Dublin"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                )}
                {step.id === 'list' && 'cta' in step && (
                  <Link href={step.href} className="mt-3 inline-block">
                    <Button size="sm">{step.cta}</Button>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Community checklist</p>
          <ul className="mt-2 space-y-1">
            <li>☐ Add first listing</li>
            <li>☐ Save a listing</li>
            <li>☐ Message a seller</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => router.push('/seller/listings/create')}>Start selling</Button>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Skip for now
          </Button>
          <Link href="/listings">
            <Button variant="ghost">Browse listings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
