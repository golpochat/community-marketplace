# Monorepo Setup

## Structure

```
apps/api      → NestJS backend
apps/web      → Next.js PWA (marketplace + /account + /admin + /super-admin)
apps/admin    → DEPRECATED (do not use)
packages/*    → Shared libraries
infra/        → Docker, Traefik, optional K8s, scripts
docs/         → Documentation
```

## Build order

```bash
pnpm --filter "./packages/*" build   # config → types → validation → utils → ui
pnpm --filter "./apps/*" build
```

## Workspace commands

```bash
pnpm dev              # API + web
pnpm dev:api          # API only
pnpm dev:web          # Web only
```

There is **no** `pnpm dev:admin`.

## Package dependencies

Apps depend on workspace packages via `workspace:*`. Always build packages before apps when testing production builds.

## Related

- [Root README](../../README.md)
- [Quickstart](./quickstart.md)
