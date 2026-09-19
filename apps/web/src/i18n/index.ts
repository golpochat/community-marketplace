import { PLATFORM_LOCALE } from '@community-marketplace/config';

const EN_IE = {
  'error.title': 'Something went wrong',
  'error.body': 'Please try again. If this keeps happening, return home and continue from there.',
  'error.retry': 'Try again',
  'error.home': 'Go home',
} as const;

const MESSAGES = {
  'en-IE': EN_IE,
  en: EN_IE,
} as const;

export type MessageKey = keyof typeof EN_IE;

export function t(key: MessageKey, locale = PLATFORM_LOCALE): string {
  const table = locale in MESSAGES ? MESSAGES[locale as keyof typeof MESSAGES] : EN_IE;
  return table[key] ?? EN_IE[key];
}
