# Database Documentation

| Resource | Description |
|----------|-------------|
| **Canonical schema** | `apps/api/prisma/schema.prisma` |
| **Canonical migrations** | `apps/api/prisma/migrations/` — see [migrations/README.md](./migrations/README.md) |
| [erd.md](./erd.md) | Entity-relationship overview (Mermaid; may lag schema — prefer Prisma) |
| [schema.prisma](./schema.prisma) | **Stale mirror — do not use for migrate** |

Roles include `MEMBER` (default marketplace account). Monetization, display ads, AI marketing, stores, reserves, and wallet tables live in the API Prisma schema.
