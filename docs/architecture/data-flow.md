# Data Flow Diagrams

> **Category:** Architecture

## Request flow (REST)

```mermaid
flowchart LR
  Client[Web / Admin] --> Traefik[Traefik]
  Traefik --> API[NestJS API]
  API --> Guard[Auth + RBAC Guards]
  Guard --> Pipe[ValidationPipe + Zod]
  Pipe --> Service[Domain Service]
  Service --> Prisma[(PostgreSQL)]
  Service --> Redis[(Redis Cache)]
  Service --> Queue[BullMQ Enqueue]
  API --> Response["{ data: T }"]
```

## Read path with cache

```mermaid
sequenceDiagram
  participant C as Client
  participant API
  participant Redis
  participant DB as PostgreSQL

  C->>API: GET /admin/stats
  API->>Redis: GET admin:dashboard:stats
  alt cache hit
    Redis-->>API: cached JSON
  else cache miss
    API->>DB: aggregate queries
    DB-->>API: rows
    API->>Redis: SETEX 120s
  end
  API-->>C: { data: stats }
```

## Write path with side effects

```mermaid
sequenceDiagram
  participant C as Client
  participant API as listings service
  participant DB as PostgreSQL
  participant EVT as EventBus
  participant JOB as BullMQ

  C->>API: POST /seller/listings
  API->>DB: INSERT listing
  API->>EVT: listing.published
  API->>JOB: search.reindex
  API-->>C: { data: listing }
```

## File upload flow (R2)

```mermaid
sequenceDiagram
  participant C as Client
  participant API
  participant R2 as Cloudflare R2

  C->>API: POST /users/me/avatar/upload-url
  API-->>C: { uploadUrl, publicUrl, key }
  C->>R2: PUT (presigned)
  C->>API: POST confirm with publicUrl
  API->>API: verify key ownership
```

## Related

- [Sequence Diagrams](./sequence-diagrams.md)
- [Deployment Architecture](./deployment-architecture.md)
