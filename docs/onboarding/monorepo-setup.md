# Monorepo Setup

## Structure

```
apps/api      → NestJS backend
apps/web      → Public Next.js PWA
apps/admin    → Admin Next.js dashboard
packages/*    → Shared libraries
infra/        → Docker, K8s, scripts
docs/         → Documentation
```

## Build order

```bash
pnpm --filter "./packages/*" build   # config → types → validation → utils → ui
pnpm --filter "./apps/*" build
```

## Workspace commands

```bash
pnpm dev              # All apps (turbo/watch)
pnpm dev:api          # API only
pnpm dev:web          # Web only
pnpm dev:admin        # Admin only
```

## Package dependencies

Apps depend on workspace packages via `workspace:*`. Always build packages before apps when testing production builds.

## Related

- [Root README](../../README.md)
- [Quickstart](./quickstart.md)
