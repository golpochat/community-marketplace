# Community Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Enterprise-grade community marketplace platform built as a **pnpm monorepo**. Buyers and sellers trade through listings, messaging, payments, and search — with dedicated admin tooling for operations, moderation, and platform governance.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [RBAC Model](#rbac-model)
- [Authentication System](#authentication-system)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Environment Variables](#environment-variables)
- [Deployment Overview](#deployment-overview)
- [Documentation](#documentation)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Project Overview

Community Marketplace is a full-stack platform for local and niche community trading. It separates concerns across three applications:

| Application | Audience | Purpose |
|-------------|----------|---------|
| **Web** (`apps/web`) | Buyers & sellers | Public marketplace PWA |
| **Admin** (`apps/admin`) | Operators | Platform administration dashboard |
| **API** (`apps/api`) | All clients | Unified REST + WebSocket backend |

Shared contracts — types, validation, UI primitives, and configuration — live in workspace packages so every app stays type-safe and consistent.

---

## Monorepo Structure

```
community-marketplace/
├── apps/
│   ├── api/              # NestJS REST + WebSocket API (Prisma, auth, domain modules)
│   ├── web/              # Next.js 15 public marketplace (port 3000)
│   └── admin/            # Next.js 15 admin dashboard (port 3001)
├── packages/
│   ├── config/           # Zod env loaders, constants, TS base configs
│   ├── types/            # Canonical TypeScript interfaces (RBAC, auth, domain)
│   ├── validation/       # Shared Zod schemas
│   ├── utils/            # Date, string, currency helpers
│   └── ui/               # Shared React component library
├── docs/
│   ├── README.md           # Master documentation index
│   ├── architecture/       # System design, diagrams
│   ├── api/                # REST endpoint reference
│   ├── features/           # Functional specifications
│   ├── infrastructure/     # Docker, K8s, CI/CD
│   ├── admin/              # Admin operator guides
│   ├── security/           # RBAC, hardening, checklist
│   ├── runbooks/           # Operational procedures
│   ├── onboarding/         # Developer setup
│   ├── product/            # Requirements, roadmap
│   └── db/                 # Schema, ERD, migrations
├── infra/
│   ├── docker/           # Docker Compose + Dockerfiles
│   ├── k8s/              # Kubernetes base + dev/prod overlays
│   ├── traefik/          # Reverse proxy / TLS
│   └── scripts/          # Deploy, migrate, seed, backup
├── package.json
└── pnpm-workspace.yaml
```

**Package build order:** `config → types → validation → utils → ui → apps`

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Monorepo** | pnpm workspaces, TypeScript 5.7 project references |
| **Frontend** | Next.js 15, React 19, Tailwind CSS, Zustand |
| **Backend** | NestJS 10, Prisma ORM, Socket.IO |
| **Database** | PostgreSQL 16 |
| **Cache / queues** | Redis 7 (infra provisioned; BullMQ integration planned) |
| **Search** | Meilisearch |
| **Object storage** | Cloudflare R2 (planned for listing images) |
| **Payments** | Stripe Connect |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Validation** | Zod (shared) + class-validator (API DTOs) |
| **Infrastructure** | Docker Compose, Kubernetes, Traefik |

---

## RBAC Model

Four hierarchical roles with granular permissions:

| Role | Scope | Default dashboard |
|------|-------|-------------------|
| `SUPER_ADMIN` | Full platform governance | `/super-admin/dashboard` (admin app) |
| `ADMIN` | Operations, moderation, scoped RBAC delegation | `/admin/dashboard` (admin app) |
| `SELLER` | Listings, sales, seller profile | `/seller/dashboard` (web app) |
| `BUYER` | Purchases, reviews, buyer profile | `/buyer/dashboard` (web app) |

**Permission model:**

- Permissions are defined in `packages/types` (`PERMISSIONS`, `DEFAULT_ROLE_PERMISSIONS`)
- Stored in PostgreSQL: `roles`, `permissions`, `role_permissions`, `user_permissions`
- Per-user **GRANT** / **DENY** overrides via `user_permissions`
- API enforcement: global `AuthGuard` + `RolesPermissionsGuard` with `@RequireRole` / `@RequirePermissions`
- Seed: `pnpm seed:rbac`

---

## Authentication System

Phone-first registration with JWT email activation and secure session management.

### Registration flow

1. **Send OTP** — `POST /api/auth/otp/send` (phone, purpose `register`)
2. **Verify OTP** — `POST /api/auth/otp/verify` → returns `phoneVerificationToken` (**no user created**)
3. **Complete registration** — `POST /api/auth/register/complete` (name, email, phone token) → activation email
4. **Activate** — `POST /api/auth/activate` (JWT from email) → user created with `email_verified_at` + `phone_verified_at`

### Login & sessions

- **Password login** for provisioned accounts (e.g. seeded super admin)
- **OTP login** for existing users (phone or email)
- **Access token** — JWT, 15 min, `Authorization: Bearer`
- **Refresh token** — JWT, 7 days, hashed in `auth_sessions`, rotated on refresh
- **httpOnly cookie** — `cm_refresh_token` for web clients (`credentials: include`)

### Security controls

- Brute-force lockout (10 failures / 15 min)
- OTP rate limiting (5 sends / 10 min)
- Device fingerprinting (`User-Agent` + IP + `X-Device-Fingerprint`)
- Audit log table (`auth_login_audit`)
- Email and phone uniqueness constraints

Full API reference: [`docs/api/auth.md`](docs/api/auth.md)

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| PostgreSQL | 15+ (or Docker) |
| Docker | Optional — full local stack |

### Quick start

```bash
git clone https://github.com/golpochat/community-marketplace.git
cd community-marketplace
pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env

docker compose -f infra/docker/docker-compose.yml up -d

pnpm --filter @community-marketplace/api prisma:generate
pnpm --filter @community-marketplace/api prisma:migrate
pnpm seed:rbac

pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api |

---

## Development Workflow

### Root scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:web` | Web app only |
| `pnpm dev:admin` | Admin app only |
| `pnpm dev:api` | Build packages + API with hot reload |
| `pnpm build` | Production build (packages → apps) |
| `pnpm typecheck` | TypeScript across monorepo |
| `pnpm lint` | ESLint in all workspaces |
| `pnpm seed:rbac` | Seed roles, permissions, super admin |

### Adding a feature

1. Types → `packages/types`
2. Zod schemas → `packages/validation`
3. Prisma schema + migration → `apps/api/prisma`
4. NestJS module → `apps/api/src/modules`
5. Frontend service + pages → `apps/web` or `apps/admin`

### API conventions

- Global prefix: `/api`
- Responses wrapped as `{ data: T }`
- `@Public()` for unauthenticated routes
- Shared validation via `@community-marketplace/validation`

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL URL | `postgresql://cm:cm_dev_password@localhost:5434/community_marketplace` |
| `JWT_SECRET` | JWT signing secret (≥ 16 chars) | Strong random value in prod |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000,http://localhost:3001` |
| `WEB_APP_URL` | Activation email base URL | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe API key | |
| `MEILISEARCH_HOST` | Search server | `http://localhost:7700` |
| `MEILISEARCH_API_KEY` | Search API key | |
| `FCM_PROJECT_ID` | Firebase project | |
| `RBAC_SEED_*` | Dev super-admin bootstrap | See `.env.example` |

### Web & Admin

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base (`http://localhost:4000/api`) |
| `NEXT_PUBLIC_APP_URL` | App origin |
| `NEXT_PUBLIC_ADMIN_APP_URL` | Admin app URL (web login redirect for admin roles) |

> Never commit `.env` files. Only `.env.example` templates are tracked.

---

## Deployment Overview

### Docker

```bash
pnpm build
docker build -f infra/docker/Dockerfile.api   -t cm-api .
docker build -f infra/docker/Dockerfile.web   -t cm-web .
docker build -f infra/docker/Dockerfile.admin -t cm-admin .
docker compose -f infra/docker/docker-compose.yml up -d
```

### Kubernetes

Manifests under `infra/k8s/` with `dev` and `prod` overlays. See [`infra/k8s/README.md`](infra/k8s/README.md).

### Production checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Enable `secure` cookies (`NODE_ENV=production`)
- [ ] Wire SMS/email providers for OTP and activation
- [ ] Run `prisma migrate deploy`
- [ ] Seed RBAC (`pnpm seed:rbac`) or provision roles via migration
- [ ] Configure Traefik TLS termination
- [ ] Set up Meilisearch, Redis, PostgreSQL backups

---

## Documentation

**Master index:** [`docs/README.md`](docs/README.md) · **Search index:** [`docs/index.json`](docs/index.json)

| Area | Location |
|------|----------|
| Developer Quickstart | [`docs/onboarding/quickstart.md`](docs/onboarding/quickstart.md) |
| Architecture | [`docs/architecture/`](docs/architecture/README.md) |
| API reference | [`docs/api/`](docs/api/README.md) |
| Feature specs | [`docs/features/`](docs/features/README.md) |
| Infrastructure & runbooks | [`docs/infrastructure/`](docs/infrastructure/README.md) · [`docs/runbooks/`](docs/runbooks/README.md) |
| Admin guide | [`docs/admin/`](docs/admin/README.md) |
| Security | [`docs/security/`](docs/security/README.md) |
| Database | [`docs/db/`](docs/db/README.md) |
| Contributing | [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`CHANGELOG.md`](CHANGELOG.md) |

---

## Future Roadmap

| Area | Planned work |
|------|--------------|
| **Domain persistence** | Migrate listings, payments, chat from stubs to Prisma |
| **Redis** | BullMQ job queues, optional permission cache |
| **Storage** | Cloudflare R2 for listing images |
| **Messaging** | WebSocket JWT auth, conversation persistence |
| **Notifications** | FCM delivery pipeline |
| **Search** | Automated Meilisearch reindex on listing changes |
| **Observability** | OpenAPI generation, structured logging, metrics |
| **Auth** | Passkey/WebAuthn, social login, SMS provider integration |

See [`docs/product/roadmap.md`](docs/product/roadmap.md) for detailed product planning.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center"><strong>Community Marketplace</strong> — pnpm · Next.js · NestJS · PostgreSQL</p>
