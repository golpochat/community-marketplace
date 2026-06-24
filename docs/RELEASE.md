# Release Process

> Versioning strategy and release workflow (Feature 13.9)

## Semantic versioning

| Bump | When |
|------|------|
| **MAJOR** | Breaking API or schema changes |
| **MINOR** | New features, backward compatible |
| **PATCH** | Bug fixes, docs-only (optional tag) |

Current version: **0.1.0** (pre-1.0 — minor bumps may include breaking changes)

## Cutting a release

### 1. Prepare

- [ ] All PRs for release merged to `main`
- [ ] `pnpm -r build` passes
- [ ] Staging deploy verified
- [ ] CHANGELOG `[Unreleased]` section completed

### 2. Version bump

Update version in:

- `package.json` (root and apps if versioned independently)
- `CHANGELOG.md` — move Unreleased to dated section

### 3. Tag

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

### 4. Deploy production

GitHub Actions → **Deploy Production** → confirm `deploy`

### 5. Publish release notes

Create GitHub Release from tag using [template](#release-notes-template).

## Release notes template

```markdown
## What's New

- Bullet summary of features

## API Changes

- New endpoints or breaking changes

## Infrastructure

- Deploy/migration notes

## Upgrade

1. Run migrations: `./infra/scripts/migrate.sh prod`
2. Verify health: `curl .../api/health/ready`

## Full Changelog

https://github.com/org/community-marketplace/blob/main/CHANGELOG.md
```

## Documentation updates

After each release:

1. Update version in `docs/README.md` if present
2. Regenerate `docs/index.json`
3. Tag docs in CHANGELOG

## Hotfix process

1. Branch from release tag: `hotfix/v0.1.1`
2. Fix + patch version bump
3. Deploy prod directly after staging smoke test
4. Cherry-pick to `main`

## Related

- [CHANGELOG.md](../CHANGELOG.md)
- [Deploy runbook](./runbooks/deploy.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
