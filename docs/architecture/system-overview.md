# System Overview

> **Category:** Architecture · **Version:** 0.1.0

Community Marketplace is a pnpm monorepo with three client apps, a NestJS API, shared packages, BullMQ workers, and supporting infrastructure services.

## High-level architecture

```mermaid
flowchart TB
    subgraph Clients
        WEB[apps/web<br/>Next.js PWA]
        ADMIN[apps/admin<br/>Next.js Dashboard]
    end

    subgraph Edge
        TRAEFIK[Traefik<br/>Reverse Proxy / TLS]
    end

    subgraph API Layer
        API[apps/api<br/>NestJS]
        WS[WebSocket Gateway<br/>Chat]
    end

    subgraph Shared Packages
        TYPES[packages/types]
        VAL[packages/validation]
        UTILS[packages/utils]
        UI[packages/ui]
        CFG[packages/config]
    end

    subgraph Data & Search
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        MEILI[(Meilisearch)]
    end

    subgraph External
        STRIPE[Stripe Connect]
        FCM[Firebase FCM]
    end

    WEB --> TRAEFIK
    ADMIN --> TRAEFIK
    TRAEFIK --> WEB
    TRAEFIK --> ADMIN
    TRAEFIK --> API
    WEB -. REST .-> API
    ADMIN -. REST .-> API
    WEB -. WS .-> WS
    API --> WS
    API --> PG
    API --> REDIS
    API --> MEILI
    API --> STRIPE
    API --> FCM
    API --> TYPES
    API --> VAL
    WEB --> UI
    ADMIN --> UI
```

## Service map

| Service | Port | Responsibility |
|---------|------|----------------|
| `web` | 3000 | Public marketplace UI |
| `admin` | 3001 | Operations dashboard |
| `api` | 4000 | REST + WebSocket backend |
| `meilisearch` | 7700 | Full-text search |
| `postgres` | 5432 | Primary datastore |
| `redis` | 6379 | Cache, sessions, job queues |
| `traefik` | 80/443 | Routing, TLS termination |

## Deployment targets

| Environment | Tooling |
|-------------|---------|
| Local | `docker compose` + `infra/scripts/deploy.sh` |
| Kubernetes | `infra/k8s/base` + overlays (`dev`, `staging`, `prod`) |

## Related docs

- [Modular Monolith](./modular-monolith.md)
- [Domain Modules](./domain-modules.md)
- [Deployment Architecture](./deployment-architecture.md)
- [Module boundaries](./module-boundaries.md)
- [Sequence diagrams](./sequence-diagrams.md)
