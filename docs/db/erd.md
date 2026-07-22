# Entity Relationship Diagram

> **Canonical schema:** [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)  
> **Migrations:** [`apps/api/prisma/migrations/`](../../apps/api/prisma/migrations/) — see [migrations/README.md](./migrations/README.md)  
> This ERD is an overview. Prefer Prisma for field-level truth. `docs/db/schema.prisma` is a **stale mirror — do not migrate from it**.

**Last reviewed:** 2026-07-22

## RBAC

```mermaid
erDiagram
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included_in
    USER }o--|| ROLE : primary_role
    USER ||--o{ USER_PERMISSION : overrides
    PERMISSION ||--o{ USER_PERMISSION : targeted_by
    USER ||--o{ ADMIN_INVITATION : invited_as

    ROLE {
        uuid id PK
        string code UK
        string name
        boolean is_system
    }

    PERMISSION {
        uuid id PK
        string code UK
        string resource
        string action
    }

    USER_PERMISSION {
        uuid id PK
        uuid user_id FK
        uuid permission_id FK
        enum effect
        datetime expires_at
    }
```

**Role codes:** `SUPER_ADMIN`, `ADMIN`, `MEMBER` (default marketplace), `SELLER`, `BUYER` (+ admin personas e.g. `ACCOUNTS_ADMIN`).

**Override semantics:** `GRANT` adds a permission; `DENY` revokes it even if the role grants it.

## Domain (core)

```mermaid
erDiagram
    USER ||--o{ STORE : owns
    USER ||--o{ LISTING : sells
    STORE ||--o{ LISTING : contains
    USER ||--o{ PAYMENT : "buys/sells"
    USER ||--o{ CHAT_THREAD : participates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o| BUYER_WALLET : has
    USER ||--o| USER_PROFILE : has
    USER ||--o{ SELLER_VERIFICATION_REQUEST : submits
    USER ||--o| STRIPE_CONNECT_ACCOUNT : owns

    LISTING ||--o{ LISTING_IMAGE : has
    LISTING }o--|| CATEGORY : "belongs to"
    LISTING ||--o{ LISTING_RESERVE : holds
    LISTING ||--o{ PLATFORM_PURCHASE : boosted_by

    BUYER_WALLET ||--o{ WALLET_TRANSACTION : records
    BUYER_WALLET ||--o{ CASHBACK_GRANT : earns

    USER {
        uuid id PK
        string email UK
        uuid primary_role_id FK
        string display_name
        enum status
    }

    STORE {
        uuid id PK
        uuid user_id FK
        string slug UK
        string name
    }

    LISTING {
        uuid id PK
        uuid seller_id FK
        uuid store_id FK
        uuid category_id FK
        string title
        decimal price
        string currency
        enum status
    }

    PAYMENT {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        uuid listing_id FK
        decimal amount
        enum status
        string stripe_payment_intent_id
    }

    BUYER_WALLET {
        uuid user_id PK
        decimal balance
    }

    LISTING_RESERVE {
        uuid id PK
        uuid listing_id FK
        uuid buyer_id FK
        enum status
        datetime expires_at
    }
```

### Listing status (Prisma)

`draft`, `pending_review`, `active`, `reserved`, `paused`, `expired`, `sold`, `ended`, `removed`, `rejected`, `flagged`, `under_investigation`, `suspended_seller`

## Monetization & ads

```mermaid
erDiagram
    PLATFORM_SETTINGS ||--|| PLATFORM : configures
    MONETIZATION_PRODUCT ||--o{ PLATFORM_PURCHASE : sold_as
    USER ||--o{ PLATFORM_PURCHASE : buys
    DISPLAY_AD_CAMPAIGN ||--o{ PLATFORM : serves_on

    PLATFORM_SETTINGS {
        boolean displayAdsEnabled
        boolean boostsEnabled
        boolean featuredEnabled
        boolean aiMarketingEnabled
    }

    PLATFORM_PURCHASE {
        uuid id PK
        uuid user_id FK
        string type
        enum status
        string stripe_payment_intent_id
    }

    DISPLAY_AD_CAMPAIGN {
        uuid id PK
        string placement
        enum status
        datetime starts_at
        datetime ends_at
        int impressions
        int clicks
    }

    AI_GENERATION_LOG {
        uuid id PK
        uuid user_id FK
        string task
        int units_charged
    }
```

Also in schema: `MarketplaceDispute`, fraud signals, chat flags, short links / share, notification templates/providers, title/price/delivery change logs.

## Related

- Canonical: `apps/api/prisma/schema.prisma`
- [migrations/README.md](./migrations/README.md)
- Product: [storefront-model.md](../product/storefront-model.md), [monetization.md](../product/monetization.md), [listing-reserve.md](../product/listing-reserve.md)
