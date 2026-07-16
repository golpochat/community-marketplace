import { redirect } from 'next/navigation';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

/** Legacy public chat stub — unified inbox is under the account hub. */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 0) {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) query.append(key, entry);
      }
    }
  }

  const qs = query.toString();
  redirect(qs ? `${WEB_APP_ROUTES.accountMessages}?${qs}` : WEB_APP_ROUTES.accountMessages);
}
