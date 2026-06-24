# Deprecated: `apps/admin`

The admin dashboard has been merged into **`apps/web`** (port **3000**).

## Unified routes

| Role | Dashboard |
|------|-----------|
| Super Admin | http://localhost:3000/super-admin/dashboard |
| Admin | http://localhost:3000/admin/dashboard |
| Seller | http://localhost:3000/seller/dashboard |
| Buyer | http://localhost:3000/buyer/dashboard |

## Development

```bash
pnpm dev:web
# or from repo root:
pnpm dev
```

Do not run `apps/admin` on port 3001. This package is kept temporarily for reference and will be removed in a future cleanup.
