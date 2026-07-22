# Community Marketplace — Documentation

> **Version:** 0.1.0 · **Last updated:** 2026-07-22  
> Central index for architecture, API, features, infrastructure, security, and operations.  
> **Frontend:** unified `apps/web` (marketplace + `/account` + `/admin` + `/super-admin`). `apps/admin` is deprecated.  
> **Pilot deploy:** prefer [OVH VPS runbook](./runbooks/ovh-vps-deploy.md) over K8s-first guides.

---

## Quick links

| Audience | Start here |
|----------|------------|
| **New developer** | [Developer Quickstart](./onboarding/quickstart.md) |
| **Something broken locally** | [Troubleshooting](./troubleshooting.md) |
| **API consumer** | [API Reference](./api/README.md) |
| **Operator / SRE** | [Infrastructure](./infrastructure/README.md) · [Runbooks](./runbooks/README.md) |
| **Admin user** | [Admin Guide](./admin/README.md) |
| **Security review** | [Security](./security/README.md) |

---

## Documentation map

```
docs/
├── README.md                 ← You are here
├── STANDARDS.md              ← Writing & formatting standards
├── index.json                ← Machine-readable index (search integration)
├── architecture/             ← System design & diagrams
├── api/                      ← REST & WebSocket reference
├── features/                 ← Functional specifications
├── infrastructure/           ← Docker, K8s, CI/CD, observability
├── admin/                    ← Admin panel operator guides
├── security/                 ← RBAC, auth, hardening, checklist
├── runbooks/                 ← Operational procedures
├── troubleshooting.md        ← Local dev symptom → fix guide
├── onboarding/               ← Developer setup & workflows
├── product/                  ← Requirements & roadmap
└── db/                       ← Schema, ERD, migrations
```

---

## 13.1 — By category

### Architecture

| Document | Description |
|----------|-------------|
| [System Overview](./architecture/system-overview.md) | High-level architecture |
| [Modular Monolith](./architecture/modular-monolith.md) | NestJS module design |
| [Domain Modules](./architecture/domain-modules.md) | Users, Listings, Chat, Payments, … |
| [Event-Driven Architecture](./architecture/event-driven.md) | Events, jobs, async flows |
| [Data Flow](./architecture/data-flow.md) | Request & data flow diagrams |
| [Sequence Diagrams](./architecture/sequence-diagrams.md) | Auth, payments, chat |
| [Deployment Architecture](./architecture/deployment-architecture.md) | Docker Compose (pilot) + optional K8s / Traefik |
| [Module Boundaries](./architecture/module-boundaries.md) | Cross-module rules |

### API reference

| Document | Base path |
|----------|-----------|
| [Auth](./api/auth.md) | `/api/auth` |
| [Users](./api/users.md) | `/api/users`, `/api/admin/users` |
| [Listings](./api/listings.md) | `/api/listings`, `/api/seller/listings`, `/api/stores` |
| [Chat](./api/chat.md) | `/api/chat`, WebSocket |
| [Payments](./api/payments.md) | `/api/buyer/payments`, `/api/seller/earnings`, `/api/checkout` |
| [Notifications](./api/notifications.md) | `/api/notifications` |
| [Search](./api/search.md) | `/api/search` |
| [Moderation](./api/moderation.md) | `/api/moderation` |
| [Admin APIs](./api/admin.md) | `/api/admin`, `/api/super-admin` |

Also live (see [api/README](./api/README.md)): monetization `/api/ads`, AI marketing hub, verification, disputes, fraud, share, statements/finance, platform.

### Features (functional specs)

| Feature | Document |
|---------|----------|
| Authentication | [features/authentication.md](./features/authentication.md) |
| RBAC | [features/rbac.md](./features/rbac.md) |
| Users | [features/users.md](./features/users.md) |
| Listings | [features/listings.md](./features/listings.md) |
| Chat | [features/chat.md](./features/chat.md) |
| Payments | [features/payments.md](./features/payments.md) |
| Notifications | [features/notifications.md](./features/notifications.md) |
| Search | [features/search.md](./features/search.md) |
| Moderation | [features/moderation.md](./features/moderation.md) |
| Admin Panel | [features/admin-panel.md](./features/admin-panel.md) |

### Infrastructure & operations

| Document | Description |
|----------|-------------|
| [Infrastructure Overview](./infrastructure/README.md) | Docker, K8s, CI/CD, observability |
| [Deploy Runbook](./runbooks/deploy.md) | Dev / staging / prod |
| [Rollback Runbook](./runbooks/rollback.md) | Revert deployments |
| [Backup Restore](./runbooks/restore-backup.md) | Disaster recovery |
| [Scaling](./runbooks/scaling.md) | HPA & capacity |

### Admin & security

| Document | Description |
|----------|-------------|
| [Admin Panel Guide](./admin/README.md) | Operator console |
| [Security Overview](./security/README.md) | Platform security model |
| [Developer Security Checklist](./security/checklist.md) | Pre-merge checklist |

### Onboarding & product

| Document | Description |
|----------|-------------|
| [Developer Quickstart](./onboarding/quickstart.md) | 15-minute setup |
| [Launch checklist](./product/launch-checklist.md) | Pilot vs public launch readiness |
| [SEO audit & roadmap](./product/seo-audit.md) | Current SEO status, gaps, phased plan |
| [AI Marketing Hub](./product/ai-marketing-hub.md) | Phases 0–4 pilot-ready: credits, text/image tools, Growth Pack, featured storefront; video/forecast deferred |
| [Storefront model](./product/storefront-model.md) | Account vs storefront, listing limits, verification |
| [Product index](./product/README.md) | Full product doc index |
| [Product Requirements](./product/functional-requirements.md) | Functional scope |
| [Database Schema](./db/README.md) | Prisma schema & ERD |

---

## Versioning & contributions

- [CHANGELOG.md](../CHANGELOG.md) — release history
- [Release process](./RELEASE.md) — semver & tagging
- [CONTRIBUTING.md](../CONTRIBUTING.md) — code & docs contributions
- [Documentation standards](./STANDARDS.md) — formatting rules

---

## Search index

Machine-readable catalog: [`index.json`](./index.json). Regenerate after adding docs:

```bash
pnpm docs:index
```

---

## Related

- [Root README](../README.md) — project overview
- [Dev credentials](./dev-credentials.md) — local test accounts
