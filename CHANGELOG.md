# Changelog

All notable changes to Community Marketplace are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enterprise documentation system (`/docs` restructure, index.json, runbooks, onboarding)
- Enterprise infrastructure layer (Docker, K8s, CI/CD, observability, BullMQ worker)
- Enterprise admin panel (RBAC-aware UI, management screens)
- Enterprise moderation module (reports, actions, appeals, analytics)
- API health probes (`/health/live`, `/health/ready`, `/health/queues`)
- Prometheus metrics endpoint (`/api/metrics`)
- Pino structured logging
- R2 presigned upload URLs

### Changed

- Next.js web/admin: `output: 'standalone'` for Docker builds
- Documentation moved to categorized folders under `/docs`

## [0.1.0] - 2026-06-24

### Added

- Initial monorepo scaffold (api, web, admin, packages)
- Auth: OTP, JWT, email activation
- RBAC with roles and permissions
- Listings, chat, payments, notifications, search modules
- Prisma schema and migrations
- Docker Compose development stack

[Unreleased]: https://github.com/org/community-marketplace/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/org/community-marketplace/releases/tag/v0.1.0
