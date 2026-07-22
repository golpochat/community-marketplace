# Users API

> Base paths: `/api/users`, `/api/buyer/profile`, `/api/seller/profile`, `/api/admin/users`

Enterprise user management: profiles, seller verification, settings, RBAC permission resolution, and admin lifecycle operations.

---

## Overview

| Area | Base path | Access |
|------|-----------|--------|
| Current user | `/users/me` | Authenticated |
| Buyer profile | `/buyer/profile` | `BUYER` |
| Seller profile + verification | `/seller/profile` | `SELLER` |
| Admin user management | `/admin/users` | `ADMIN` / `SUPER_ADMIN` + permissions |

All responses are wrapped as `{ "data": ... }`.

---

## 4.1 — User model

### Core fields (`users` table)

| Field | API | Notes |
|-------|-----|-------|
| `id` | `id` | UUID |
| `display_name` | `displayName` | Name |
| `email` | `email` | Unique |
| `profile.phone` | `phone` | E.164, unique |
| `primary_role_id` | `primaryRoleId` | FK → `roles` |
| `role` | `role` | Denormalized role code |
| `email_verified_at` | `emailVerified` | Boolean in API |
| `phone_verified_at` | `phoneVerified` | Boolean in API |
| `profile_completed` | `profileCompleted` | Boolean |
| `avatar_url` | `avatarUrl` | CDN URL (R2) |
| `status` | `status` | `active` \| `inactive` \| `suspended` |

### Profile fields (`user_profiles`)

| Field | API |
|-------|-----|
| `bio` | `bio` |
| `address` | `address` |
| `location` + lat/lng | `location: { label, latitude, longitude }` |
| `date_of_birth` | `dateOfBirth` (`YYYY-MM-DD`) |
| `gender` | `gender` |

### Relations

`roles`, `user_permissions`, `listings`, `payments`, `notifications`, `user_verifications`, `user_bans`, `user_settings`, `user_audit_logs`

---

## 4.2 — Profile management

### Get current profile

```http
GET /api/users/me
Authorization: Bearer <access_token>
```

```json
{
  "data": {
    "id": "uuid",
    "email": "seller@example.com",
    "displayName": "Jane Seller",
    "role": "SELLER",
    "emailVerified": true,
    "phoneVerified": true,
    "profileCompleted": true,
    "verificationBadge": false,
    "bio": "Local seller",
    "phone": "+14155552671"
  }
}
```

### Update profile

```http
PATCH /api/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "Jane Seller",
  "bio": "Updated bio",
  "phone": "+14155552671",
  "address": "123 Main St",
  "location": { "label": "San Francisco", "latitude": 37.77, "longitude": -122.42 }
}
```

**RBAC:** `SELLER` and `BUYER` may update **own** profile only. `ADMIN` with `manage_users` and `SUPER_ADMIN` may update any profile (via admin tools).

### Mark profile completed

```http
POST /api/users/me/profile/complete
Authorization: Bearer <access_token>

{ "displayName": "Jane Seller", "bio": "Hello" }
```

### Avatar upload (Cloudflare R2)

**Step 1 — Get upload URL**

```http
POST /api/users/me/avatar/upload-url
{ "contentType": "image/jpeg", "fileName": "avatar.jpg" }
```

**Step 2 — Upload to R2** using returned `uploadUrl` (PUT with `Content-Type`).

**Step 3 — Confirm**

```http
PATCH /api/users/me/avatar
{ "publicUrl": "https://assets.example.com/avatars/..." }
```

In development without R2 credentials, a dev upload placeholder URL is returned.

---

## 4.3 — Seller verification

Seller identity (KYC) uses the live **Seller Verification** APIs under `/api/seller/verification/*` and admin review under `/api/admin/seller-verification/*`.

See [Seller verification (admin)](../admin/seller-verification.md) and the seller verification module docs.

The legacy `user_verifications` badge endpoints (`POST /seller/profile/verification`, `GET/POST /admin/users/verifications/...`) have been removed.

---

## 4.4 — User settings

### Get settings

```http
GET /api/users/me/settings
```

### Update settings

```http
PATCH /api/users/me/settings

{
  "notificationPreferences": { "email": true, "push": false },
  "privacySettings": { "profileVisibility": "members" },
  "communicationPreferences": { "language": "en", "timezone": "America/Los_Angeles" }
}
```

### Request account deletion

```http
POST /api/users/me/settings/delete-request
```

Only the account owner may modify settings.

---

## 4.5 — Permission resolution

### Current user permissions

```http
GET /api/users/me/permissions
```

Returns effective permissions (role defaults + GRANT/DENY overrides).

### Admin: user permissions

```http
GET /api/users/:id/permissions
```

Requires `ADMIN` or `SUPER_ADMIN` with `view_users`.

Role/override assignment uses existing RBAC endpoints under `/api/admin/rbac/*` and `/api/super-admin/*`.

---

## 4.6 — Admin user management

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/admin/users` | `view_users` |
| `GET` | `/admin/users/search?q=` | `view_users` |
| `GET` | `/admin/users/:id` | `view_users` |
| `POST` | `/admin/users/suspend` | `suspend_user` |
| `POST` | `/admin/users/:id/unsuspend` | `suspend_user` |
| `POST` | `/admin/users/ban` | `ban_user` |
| `POST` | `/admin/users/:userId/bans/:banId/unban` | `ban_user` |
| `GET` | `/admin/users/audit-logs` | `view_audit_log` |

### List filters

`role`, `status`, `verificationStatus`, `search`, `page`, `limit`

### RBAC rules

- **SUPER_ADMIN** — full access; only role that can manage other admins
- **ADMIN** — manage sellers/buyers when holding `manage_users`, `suspend_user`, `ban_user`, etc.
- Cannot suspend/ban `SUPER_ADMIN` or `ADMIN` without `SUPER_ADMIN`

---

## 4.7 — Audit logs

Events recorded in `user_audit_logs`:

| Event | Trigger |
|-------|---------|
| `profile_update` | Profile PATCH |
| `profile_completed` | Profile completion |
| `verification_submitted` | Seller verification request |
| `verification_approved` / `verification_rejected` | Admin review |
| `role_changed` | Role assignment |
| `user_suspended` / `user_unsuspended` | Status changes |
| `user_banned` / `user_unbanned` | Ban lifecycle |
| `settings_updated` | Settings PATCH |
| `deletion_requested` | Account deletion request |
| `avatar_uploaded` | Avatar confirm |

```http
GET /api/admin/users/audit-logs?targetUserId=uuid&eventType=profile_update&page=1&limit=50
```

---

## 4.8 — Dashboard routing (frontend)

Login responses include RBAC-aware `redirectPath`:

| Role | Path | App |
|------|------|-----|
| `SUPER_ADMIN` | `/super-admin/dashboard` | web |
| `ADMIN` (+ personas) | `/admin/dashboard` | web |
| `MEMBER` / `SELLER` / `BUYER` | `/account` | web |

Dashboard pages consume:

- `GET /users/me` — profile
- `GET /users/me/permissions` — effective permissions

---

## Error cases

| HTTP | Scenario |
|------|----------|
| `400` | Validation error, pending verification already exists |
| `403` | Updating another user's profile, insufficient admin permissions |
| `404` | User or verification not found |
| `409` | Email or phone already in use |

---

## Environment variables (R2)

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET` | Bucket name |
| `R2_PUBLIC_URL` | Public CDN base URL for assets |

---

## Security notes

1. Profile email/phone changes should trigger re-verification in production (future enhancement).
2. Verification document URLs should use short-lived presigned R2 URLs, not public buckets.
3. Admin actions are audit-logged; combine with `auth_login_audit` for full traceability.
4. Account deletion requests are staged — hard delete requires a separate compliance workflow.
