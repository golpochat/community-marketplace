# Testing & Quality

## Commands

```bash
pnpm -r lint          # ESLint all packages
pnpm -r typecheck     # TypeScript
pnpm -r build         # Production build all
```

## API only

```bash
pnpm --filter @community-marketplace/api lint
pnpm --filter @community-marketplace/api typecheck
pnpm --filter @community-marketplace/api build
```

## CI

GitHub Actions `build.yml` runs lint, typecheck, build, and Docker image build on PRs.

## Pre-PR checklist

- [ ] `pnpm -r build` passes
- [ ] No secrets in diff
- [ ] Docs updated if API/behavior changed
- [ ] `pnpm docs:index` if docs added

## Related

- [Security checklist](../security/checklist.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
