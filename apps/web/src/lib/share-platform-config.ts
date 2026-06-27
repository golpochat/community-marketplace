import type { SharePlatform } from '@community-marketplace/types';
import type { LucideIcon } from 'lucide-react';
import { Copy, Mail, MessageCircle, Send, Share2 } from 'lucide-react';

import type { buildShareLinks } from '@/services/share.service';

export type ShareLinkMap = ReturnType<typeof buildShareLinks>;

export type SharePlatformAction =
  | {
      id: SharePlatform;
      label: string;
      icon: LucideIcon;
      kind: 'link';
      href: (links: ShareLinkMap) => string;
      external?: boolean;
    }
  | {
      id: SharePlatform;
      label: string;
      icon: LucideIcon;
      kind: 'copy';
    };

export const SHARE_PRIMARY_PLATFORMS: SharePlatformAction[] = [
  {
    id: 'WHATSAPP',
    label: 'WhatsApp',
    icon: MessageCircle,
    kind: 'link',
    href: (links) => links.whatsapp,
    external: true,
  },
  {
    id: 'EMAIL',
    label: 'Email',
    icon: Mail,
    kind: 'link',
    href: (links) => links.email,
  },
  {
    id: 'FACEBOOK',
    label: 'Facebook',
    icon: Share2,
    kind: 'link',
    href: (links) => links.facebook,
    external: true,
  },
];

export const SHARE_MORE_PLATFORMS: SharePlatformAction[] = [
  {
    id: 'MESSENGER',
    label: 'Messenger',
    icon: MessageCircle,
    kind: 'link',
    href: (links) => links.messenger,
  },
  {
    id: 'TELEGRAM',
    label: 'Telegram',
    icon: Send,
    kind: 'link',
    href: (links) => links.telegram,
    external: true,
  },
  {
    id: 'X',
    label: 'X',
    icon: Share2,
    kind: 'link',
    href: (links) => links.x,
    external: true,
  },
  {
    id: 'INSTAGRAM',
    label: 'Instagram',
    icon: Copy,
    kind: 'copy',
  },
];

export function extractShareSubtitle(shareText: string): string | undefined {
  const lines = shareText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const detail = lines.find(
    (line) => !line.startsWith('http') && !line.toLowerCase().startsWith('check out'),
  );
  return detail;
}
