# Entity Relationship Diagram

> Canonical schema: [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

## RBAC

```mermaid
erDiagram
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included_in
    USER }o--|| ROLE : primary_role
    USER ||--o{ USER_PERMISSION : overrides
    PERMISSION ||--o{ USER_PERMISSION : targeted_by

    ROLE {
        uuid id PK
        enum code UK
        string name
        boolean is_system
    }

    PERMISSION {
        uuid id PK
        string code UK
        string resource
        string action
    }

    ROLE_PERMISSION {
        uuid role_id PK_FK
        uuid permission_id PK_FK
    }

    USER_PERMISSION {
        uuid id PK
        uuid user_id FK
        uuid permission_id FK
        enum effect
        datetime expires_at
    }
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, `SELLER`, `BUYER`

**Override semantics:** `user_permissions.effect` — `GRANT` adds a permission; `DENY` revokes it even if the role grants it.

## Domain (core)

```mermaid
erDiagram
    USER ||--o{ LISTING : sells
    USER ||--o{ PAYMENT : "buys/sells"
    USER ||--o{ CONVERSATION : participates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ REPORT : files
    USER ||--o{ BAN : "subject of"
    USER ||--o| USER_PROFILE : has
    USER ||--o{ USER_VERIFICATION : has
    USER ||--o| STRIPE_CONNECT_ACCOUNT : owns
    USER ||--o{ DEVICE_TOKEN : registers

    LISTING ||--o{ LISTING_IMAGE : has
    LISTING }o--|| CATEGORY : "belongs to"
    LISTING ||--o{ PAYMENT : "paid for"
    LISTING ||--o{ CONVERSATION : "context for"

    CONVERSATION ||--o{ CHAT_MESSAGE : contains

    USER {
        uuid id PK
        string email UK
        uuid primary_role_id FK
        string display_name
        enum status
        datetime created_at
        datetime updated_at
    }

    LISTING {
        uuid id PK
        uuid seller_id FK
        uuid category_id FK
        string title
        text description
        decimal price
        string currency
        enum condition
        enum status
        string location
        datetime created_at
        datetime updated_at
    }

    CHAT_MESSAGE {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        uuid recipient_id FK
        enum type
        text content
        enum status
        datetime created_at
    }

    PAYMENT {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        uuid listing_id FK
        decimal amount
        string currency
        enum method
        enum status
        string stripe_payment_intent_id
        datetime created_at
    }

    NOTIFICATION {
        uuid id PK
        uuid user_id FK
        enum type
        string title
        text body
        boolean read
        datetime created_at
    }

    REPORT {
        uuid id PK
        uuid reporter_id FK
        enum target_type
        uuid target_id
        string reason
        enum status
        datetime created_at
    }

    BAN {
        uuid id PK
        uuid user_id FK
        uuid banned_by FK
        enum type
        enum scope
        string reason
        datetime expires_at
        boolean is_active
    }
```

## Index strategy (planned)

| Table | Index | Purpose |
|-------|-------|---------|
| `listings` | `(status, created_at DESC)` | Browse feed |
| `listings` | `(seller_id)` | Seller dashboard |
| `listings` | `(category_id)` | Category filter |
| `chat_messages` | `(conversation_id, created_at)` | Message history |
| `notifications` | `(user_id, read, created_at DESC)` | Unread feed |
| `payments` | `(buyer_id)`, `(seller_id)` | User payment history |

## Related

- [schema.prisma](./schema.prisma)
- [migrations/](./migrations/)
