# Moderation API

Enterprise moderation module for the Community Marketplace platform. Covers user/listing/message reporting, automated content checks, admin review workflows, enforcement actions, appeals, audit logs, analytics, and notifications.

**Base paths**

| Role | Prefix |
|------|--------|
| Buyer / Seller | `/api/moderation`, `/api/buyer/*`, `/api/seller/reports` |
| Admin | `/api/admin/moderation` |
| Super Admin | `/api/super-admin/moderation` |

---

## Reporting system

### Predefined reasons

| Code | Description |
|------|-------------|
| `fraud` | Fraudulent activity |
| `harassment` | Harassment or abuse |
| `spam` | Spam content |
| `inappropriate_content` | Inappropriate content |
| `scams` | Scam attempts |
| `fake_listing` | Misleading or fake listing |

### Report user

`POST /api/moderation/reports/users`

**Roles:** `BUYER`, `SELLER`

```json
{
  "targetUserId": "uuid",
  "reason": "harassment",
  "description": "Optional details (max 2000 chars)"
}
```

### Report listing

`POST /api/moderation/reports/listings`  
`POST /api/buyer/listings/:listingId/report`  
`POST /api/seller/reports/listings/:listingId`

**Roles:** `BUYER`, `SELLER`  
**Permission:** `report_listing`

```json
{
  "listingId": "uuid",
  "reason": "fake_listing",
  "description": "Optional"
}
```

### Report chat message

`POST /api/moderation/reports/messages`  
`POST /api/seller/reports/messages`

**Roles:** `BUYER`, `SELLER`  
**Permission:** `flag_message`

```json
{
  "messageId": "uuid",
  "reason": "harassment",
  "description": "Optional"
}
```

### Report statuses

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting review |
| `reviewed` | Assigned / reviewed by admin |
| `action_taken` | Enforcement action applied |

### RBAC — reporting

| Endpoint | BUYER | SELLER | ADMIN | SUPER_ADMIN |
|----------|-------|--------|-------|-------------|
| Report user | ✅ | ✅ | — | — |
| Report listing | ✅ | ✅ | — | — |
| Report message | ✅ | ✅ | — | — |
| List all reports | — | — | ✅ `view_reports` | ✅ `view_reports` |

---

## Automated moderation

On each report, the platform runs:

1. **Profanity detection** — pattern-based text scan
2. **Scam keywords** — wire transfer, gift card, off-platform contact, etc.
3. **Suspicious pricing** — price far below category average
4. **Repeated reports** — auto-escalation after threshold (default: 3)
5. **AI moderation stub** — `ModerationContentCheckService.checkWithAi()` (replace with external API)

### Flagging behavior

| Signal | Effect |
|--------|--------|
| `autoFlagged` | Report marked for priority admin review |
| `autoHidden` | Listing `moderationHiddenAt` set (hidden from public feeds) |

Configurable per-action via `autoHideListing` on admin action payload.

---

## Admin moderation tools

### List reports

`GET /api/admin/moderation/reports?status=pending&reason=scams&targetType=listing&page=1&limit=20`

**Permission:** `view_reports`

### View report detail

`GET /api/admin/moderation/reports/:id`

Returns reporter, target user, listing, message, and assigned admin.

### Assign report

`PATCH /api/admin/moderation/reports/:id/assign`

**Permission:** `manage_reports`

```json
{ "adminId": "uuid" }
```

### Add notes

`PATCH /api/admin/moderation/reports/:id/notes`

```json
{ "notes": "Reviewed — contacting seller" }
```

### Take moderation action

`POST /api/admin/moderation/reports/:id/actions`

**Permission:** `resolve_report`

```json
{
  "actionType": "suspend",
  "suspensionDuration": "days_7",
  "notes": "Repeated scam reports",
  "warnMessage": "Optional warning text",
  "autoHideListing": true
}
```

### List actions / bans / audit logs

| Endpoint | Permission |
|----------|------------|
| `GET /admin/moderation/actions` | `view_reports` |
| `GET /admin/moderation/bans` | `view_reports` |
| `GET /admin/moderation/audit-logs` | `view_audit_log` |

### RBAC — admin tools

| Action | Permission required |
|--------|---------------------|
| View reports | `view_reports` |
| Assign / manage | `manage_reports` |
| Resolve / take action | `resolve_report` |
| Ban user | `ban_user` (via action) |
| View audit log | `view_audit_log` |
| Analytics | `view_platform_stats` |

`SUPER_ADMIN` has full access. Super-admin appeal review can override prior decisions.

---

## Actions (warn, suspend, ban)

| Action | Effect |
|--------|--------|
| `warn` | Notification to user |
| `suspend` | User status → `suspended`, temporary ban record |
| `ban` | Permanent ban record, user suspended |
| `delete_listing` | Listing archived |
| `delete_message` | Message soft-deleted |

### Suspension durations

| Value | Duration |
|-------|----------|
| `hours_24` | 24 hours |
| `days_7` | 7 days |
| `days_30` | 30 days |
| `permanent` | No expiry |

Automatic un-suspension runs via `moderation.lift_suspension` job when duration elapses.

All actions are recorded in `moderation_actions` and `moderation_audit_logs`.

---

## Appeals system

### Submit appeal (user)

`POST /api/moderation/appeals`

```json
{
  "reportId": "uuid",
  "message": "I believe this report was a mistake..."
}
```

Or appeal a suspension/ban:

```json
{
  "moderationActionId": "uuid",
  "message": "Please review my suspension"
}
```

### List / review (admin)

| Endpoint | Method |
|----------|--------|
| `/admin/moderation/appeals` | GET |
| `/admin/moderation/appeals/:id` | GET |
| `/admin/moderation/appeals/:id` | PATCH |

Review body:

```json
{
  "status": "approved",
  "adminNotes": "Suspension lifted after review"
}
```

Approving a suspension/ban appeal automatically lifts the enforcement action.

---

## Analytics

`GET /api/admin/moderation/analytics?days=30`

**Permission:** `view_platform_stats`  
**Caching:** Redis key `moderation:analytics:{days}` (TTL 300s)

Returns:

- Most reported users
- Most reported listings
- Report reason distribution
- Action statistics (warnings, suspensions, bans, deletions)
- Appeal outcomes

---

## Notifications

| Event | Recipient | Channels |
|-------|-----------|----------|
| `moderation.user_warned` | Target user | in_app, push |
| `moderation.user_suspended` | Target user | in_app, push, email |
| `moderation.user_banned` | Target user | in_app, push, email |
| `moderation.appeal_decided` | Appellant | in_app, push |
| `moderation.report_created` | Admins | in_app |

Notifications respect user `notificationPreferences` via `NotificationDispatcherService`.

---

## Error cases

| Code | Scenario |
|------|----------|
| `400` | Self-report, missing `suspensionDuration` on suspend, duplicate pending appeal |
| `403` | Appeal on item user is not involved in |
| `404` | Report, appeal, user, listing, or message not found |

---

## Database models

| Table | Purpose |
|-------|---------|
| `moderation_reports` | Unified report queue |
| `moderation_actions` | Enforcement history |
| `moderation_appeals` | User appeals |
| `moderation_audit_logs` | Immutable audit trail |

Canonical Prisma schema: `apps/api/prisma/schema.prisma`

---

## Admin panel routes

| Role | Path |
|------|------|
| ADMIN | `/admin/moderation` |
| SUPER_ADMIN | `/super-admin/moderation` |
| SUPER_ADMIN | `/super-admin/moderation` |
