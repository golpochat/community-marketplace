# Notifications API

> Base paths: `/api/buyer/notifications`, `/api/seller/notifications`, `/api/admin/notifications`, `/api/super-admin/notifications`

## Overview

Enterprise notification system with **email**, **push (FCM)**, and **in-app** channels. Templates are stored in the database, cached in Redis, and rendered with `{{variable}}` placeholders. Delivery is event-driven via the internal event bus with retries, rate limiting, and provider failover.

### Data model

| Entity | Purpose |
|--------|---------|
| `Notification` | User-facing notification record (in-app + outbound tracking) |
| `NotificationTemplate` | Versioned templates per channel |
| `NotificationProvider` | Email/push provider configuration |
| `NotificationLog` | Per-attempt delivery audit trail |
| `DeviceToken` | FCM device registration |

### Notification fields

| Field | Description |
|-------|-------------|
| `type` | Business event type (`new_message`, `payment_received`, etc.) |
| `title` / `message` | Rendered content |
| `data` | JSON metadata |
| `channel` | `email`, `push`, `in_app` |
| `status` | `pending`, `sent`, `failed` |
| `readAt` | When user marked in-app notification read |

---

## Notification templates

Templates support dynamic variables: `{{user_name}}`, `{{listing_title}}`, etc.

### Admin — create template

```http
POST /api/admin/notifications/templates
Authorization: Bearer <token>

{
  "key": "new_message",
  "titleTemplate": "New message from {{sender_name}}",
  "bodyTemplate": "{{sender_name}} sent you a message.",
  "channel": "in_app",
  "variables": ["sender_name"]
}
```

Each create increments `version` for the `(key, channel)` pair.

### Preview template

```http
POST /api/admin/notifications/templates/preview

{
  "key": "new_message",
  "channel": "in_app",
  "variables": { "sender_name": "Jane" }
}
```

---

## Notification channels

| Channel | Delivery |
|---------|----------|
| `in_app` | Stored in `notifications` table, exposed via inbox API |
| `push` | Firebase Cloud Messaging via registered device tokens |
| `email` | SendGrid HTTP API (production) or stub logger (development) |

Channel selection respects **user preferences** (`email`, `push`, `inApp`, per-event overrides).

---

## Provider abstraction

Providers are registered in `notification_providers` with JSON config.

| Provider | Type | Mode |
|----------|------|------|
| `stub-email` | email | Logs to console |
| `sendgrid` | email | SendGrid REST API (`SENDGRID_API_KEY`) |
| `stub-push` | push | Logs to console |
| `fcm` | push | FCM (`FCM_PROJECT_ID`) |

Features:
- **Health checks:** `GET /api/admin/notifications/providers/:id/health`
- **Failover:** Tries providers ordered by lowest `failureCount`
- **Auto-disable:** Provider disabled after 5 consecutive failures
- **Rate limiting:** Per-provider caps via Redis

---

## Event-driven dispatching

`NotificationDispatcherService` listens for:

| Event | Notification |
|-------|--------------|
| `chat.message_sent` | `new_message` → `/account/messages?thread=…` |
| `chat.thread_created` | `thread_created` → `/account/messages?thread=…` |
| `chat.messages_read` | *(no in-app row — read receipts stay in chat UI)* |
| `payment.succeeded` | `payment_received` |
| `payment.failed` | `payment_sent` |
| `payment.refunded` | `payment_refunded` |
| `payment.refund_requested` | `system` |
| `payment.disputed` | `system` |
| `listing.created` | `listing_created` (favoriters) |
| `listing.updated` (sold) | `listing_sold` |
| `user.verification_requested` | Staff in-app (`admin_warning`) — urgent if fast-track |
| `seller.verification_priority_activated` | Staff in-app — fast-track upgrade on pending case |
| `seller.verification_sla_overdue` | Staff in-app — priority case past 24h SLA |
| `user.verification_approved` | `verification_approved` (seller) |
| `user.verification_rejected` | `verification_rejected` (seller; includes re-queue note when applicable) |
| `seller.warned` | `admin_warning` |
| `admin.action` | `admin_warning` |

Flow: event → load template → render → check preferences → send per channel → log attempts → retry with exponential backoff.

---

## User preferences

```http
GET /api/buyer/notifications/preferences
PATCH /api/buyer/notifications/preferences

{
  "email": true,
  "push": true,
  "inApp": true,
  "messageAlerts": true,
  "listingUpdates": true,
  "events": {
    "new_message": true
  }
}
```

Same endpoints under `/api/seller/notifications/preferences`.

**RBAC:** Only the authenticated user can read/update their own preferences.

---

## In-app notification center

### Buyer

```http
GET /api/buyer/notifications?page=1&limit=20&unreadOnly=true
PATCH /api/buyer/notifications/read        { "notificationId": "uuid" }
PATCH /api/buyer/notifications/read-all
DELETE /api/buyer/notifications/:id
POST /api/buyer/notifications/devices      { "token": "...", "platform": "web" }
```

### Seller

Same routes under `/api/seller/notifications`.

### Frontend routes

| Role | Route |
|------|-------|
| All marketplace roles | `/account/notifications` |

---

## Admin notification management

```http
POST /api/admin/notifications/send
POST /api/admin/notifications/broadcast
GET  /api/admin/notifications/templates
POST /api/admin/notifications/templates
POST /api/admin/notifications/templates/preview
GET  /api/admin/notifications/providers
POST /api/admin/notifications/providers
PATCH /api/admin/notifications/providers/:id
GET  /api/admin/notifications/logs
```

### Broadcast

```http
POST /api/admin/notifications/broadcast

{
  "title": "Scheduled maintenance",
  "message": "The platform will be down tonight.",
  "role": "SELLER",
  "channels": ["in_app", "push"]
}
```

**RBAC**

| Permission | Endpoints |
|------------|-----------|
| `send_notification` | `POST .../send` |
| `manage_notifications` | templates, providers, broadcast, logs |

`SUPER_ADMIN` has full access. Super-admin read endpoints: `/api/super-admin/notifications/*`.

---

## Delivery logs & retries

Each send attempt creates a `NotificationLog` row with `status`, `response`, and `attempts`.

Retries: up to 3 attempts with exponential backoff (250ms, 500ms, 1000ms).

Rate limits:
- Per user: 50 notifications/hour (default)
- Per provider: 200/minute (default)

---

## Error cases

| Code | Scenario |
|------|----------|
| `400` | Invalid template/provider payload |
| `403` | Missing RBAC permission |
| `404` | Notification or template not found |
| `429` | Rate limit exceeded (dispatch skipped) |

---

## Environment

| Variable | Description |
|----------|-------------|
| `FCM_PROJECT_ID` | Firebase project for push |
| `SENDGRID_API_KEY` | SendGrid API key |
| `EMAIL_FROM` | Default sender address |
| `REDIS_URL` | Template cache + rate limiting |
