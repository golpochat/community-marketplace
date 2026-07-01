'use client';

import type { StoreContactInfo } from '@community-marketplace/types';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';

interface StoreContactSectionProps {
  contact?: StoreContactInfo;
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-brand-600" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function StoreContactSection({ contact }: StoreContactSectionProps) {
  if (!contact) return null;

  const hasAddress = Boolean(contact.city || contact.addressLine);
  const hasPhone = Boolean(contact.phone);
  const hasEmail = Boolean(contact.email);
  const hasWebsite = Boolean(contact.website);

  if (!hasAddress && !hasPhone && !hasEmail && !hasWebsite) {
    return null;
  }

  return (
    <div className="space-y-4">
      {hasAddress ? (
        <ContactRow icon={<MapPin className="h-4 w-4" />} label="Address">
          <div>
            {contact.city ? (
              <p className="text-base font-bold text-foreground">{contact.city}</p>
            ) : null}
            {contact.addressLine ? (
              <p className={contact.city ? 'mt-0.5 text-muted-foreground' : 'font-medium text-foreground'}>
                {contact.addressLine}
              </p>
            ) : null}
          </div>
        </ContactRow>
      ) : null}

      {hasPhone ? (
        <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone">
          <a href={`tel:${contact.phone}`} className="font-medium text-brand-700 hover:underline">
            {contact.phone}
          </a>
        </ContactRow>
      ) : null}

      {hasEmail ? (
        <ContactRow icon={<Mail className="h-4 w-4" />} label="Email">
          <a href={`mailto:${contact.email}`} className="break-all font-medium text-brand-700 hover:underline">
            {contact.email}
          </a>
        </ContactRow>
      ) : null}

      {hasWebsite ? (
        <ContactRow icon={<Globe className="h-4 w-4" />} label="Website">
          <a
            href={contact.website!.startsWith('http') ? contact.website : `https://${contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-brand-700 hover:underline"
          >
            {contact.website}
          </a>
        </ContactRow>
      ) : null}
    </div>
  );
}
