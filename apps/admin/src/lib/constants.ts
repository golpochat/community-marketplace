import { DEFAULT_API_URL } from '@community-marketplace/config';

/** Browser / client-side API base (public URL). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

/** Server-side API base — use Docker service hostname when API_INTERNAL_URL is set. */
export const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
