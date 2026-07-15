import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });

const baseUrl = 'http://localhost:4000/api';
const email = process.env.RBAC_SUPER_ADMIN_EMAIL ?? 'superadmin@sellnearby.ie';
const password = process.env.RBAC_SUPER_ADMIN_PASSWORD ?? 'ChangeMe!SuperAdmin1';

async function main() {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson?.data?.accessToken;
  if (!token) {
    console.error('login failed', loginRes.status, loginJson);
    process.exit(1);
  }

  for (const path of [
    '/super-admin/search/indexes',
    '/super-admin/search/health',
    '/super-admin/search/analytics',
    '/super-admin/search/reindex',
  ]) {
    const isReindex = path.endsWith('/reindex');
    const res = await fetch(`${baseUrl}${path}`, {
      method: isReindex ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(isReindex ? { body: JSON.stringify({ type: 'listings' }) } : {}),
    });
    const text = await res.text();
    console.log(path, res.status, text.slice(0, 400));
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
