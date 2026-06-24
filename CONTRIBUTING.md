# Contributing to Community Marketplace

Thank you for contributing. This guide covers code and documentation contributions.

## Getting started

1. Read [Developer Quickstart](docs/onboarding/quickstart.md)
2. Review [Documentation Standards](docs/STANDARDS.md)
3. Check [Security Checklist](docs/security/checklist.md) for sensitive changes

## Development workflow

```bash
git checkout -b feature/my-change
pnpm install
pnpm dev
# make changes
pnpm -r lint && pnpm -r typecheck && pnpm -r build
```

## Pull requests

- Keep PRs focused; one feature or fix per PR
- Update docs when changing API, behavior, or env vars
- Run `pnpm docs:index` after adding/renaming docs
- Add CHANGELOG entry under `[Unreleased]` for user-visible changes

## Documentation contributions

### When to update docs

| Change | Update |
|--------|--------|
| New API endpoint | `docs/api/<module>.md` |
| New feature | `docs/features/<feature>.md` |
| Infra change | `docs/infrastructure/` or runbooks |
| Admin UI screen | `docs/admin/` |

### Format

Follow [docs/STANDARDS.md](docs/STANDARDS.md):

- kebab-case filenames
- Mermaid for diagrams
- Endpoint tables with auth + permissions
- Cross-link related docs

### Index regeneration

```bash
pnpm docs:index
```

Commits `docs/index.json` with the PR.

## Code style

- Match existing patterns in the module you're editing
- TypeScript strict mode
- No inline styles in React — use Tailwind
- Shared validation in `packages/validation`

## Commits

Use clear, imperative messages:

```
feat(moderation): add appeal review endpoint
fix(auth): handle expired refresh token
docs(api): document admin stats endpoint
```

## Questions

Open a discussion or issue for architectural decisions before large changes.

## Related

- [RELEASE.md](docs/RELEASE.md) — versioning and releases
- [CHANGELOG.md](CHANGELOG.md)
