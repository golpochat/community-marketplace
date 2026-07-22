# Chat API

> Base paths: `/api/chat`, `/api/buyer/chat`, `/api/seller/chat`, `/api/admin/chat`  
> WebSocket namespace: `/chat` (connect to `http://<api-host>/chat`)

## Overview

Enterprise real-time messaging between buyers and sellers, scoped to listings. Messages persist in PostgreSQL, attachments use Cloudflare R2, inbox is Redis-cached, and push notifications integrate via FCM (when configured).

## RBAC summary

| Role | Capabilities |
|------|----------------|
| **BUYER** | Create threads, send/receive messages, inbox, typing, read receipts |
| **SELLER** | Same as buyer on their listing threads |
| **ADMIN** | `moderate_chat` — view any thread, search messages, flag, chat bans |
| **SUPER_ADMIN** | Full moderation override |

Chat bans (`chat_bans`) block send/receive for affected users.

---

## 6.1 — Data model

### ChatThread

| Field | Type |
|-------|------|
| `id` | UUID |
| `buyerId` | UUID |
| `sellerId` | UUID |
| `listingId` | UUID |
| `lastMessageAt` | datetime |
| `archivedByBuyer` / `archivedBySeller` | boolean |
| `createdAt` / `updatedAt` | datetime |

Unique: `(buyerId, sellerId, listingId)`

### ChatMessage

| Field | Type |
|-------|------|
| `id` | UUID |
| `threadId` | UUID |
| `senderId` | UUID |
| `content` | string |
| `messageType` | `text` \| `image` \| `system` |
| `attachmentUrl` | string (optional) |
| `readBy` | UUID[] |
| `editedAt` / `deletedAt` | datetime (optional) |
| `createdAt` | datetime |

System messages are non-editable and non-deletable.

---

## 6.2 — WebSocket events

**Authentication:** Pass JWT in handshake `auth.token` or `Authorization: Bearer <token>`.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_thread` | `{ threadId }` | Join thread room `thread:<id>` |
| `send_message` | `{ threadId, content, messageType?, attachmentUrl? }` | Send message |
| `typing` | `{ threadId, event: buyer_typing \| seller_typing }` | Typing indicator |
| `mark_read` | `{ threadId, messageIds? }` | Mark messages read |

On connect, server joins `user:<userId>` for notifications.

### Server → Client

| Event | Payload |
|-------|---------|
| `message` | `{ message, threadId }` |
| `message_updated` | `ChatMessage` |
| `message_deleted` | `{ messageId, threadId }` |
| `typing` | `{ threadId, userId, event }` |
| `read_receipt` | `{ threadId, readerId, messageIds }` |
| `presence` | `{ userId, status: online \| offline }` |

---

## 6.3 — REST endpoints

### Inbox & threads

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/chat/inbox` | `view_conversations` |
| `POST` | `/chat/threads` | `view_conversations` |
| `GET` | `/chat/threads/:threadId` | `view_conversations` |
| `GET` | `/chat/threads/listing/:listingId` | `view_conversations` |
| `POST` | `/chat/threads/:threadId/archive` | `view_conversations` |
| `POST` | `/chat/threads/:threadId/unarchive` | `view_conversations` |

Create thread body:

```json
{ "listingId": "<uuid>", "sellerId": "<uuid>" }
```

### Messages

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/chat/threads/:threadId/messages` | `view_conversations` |
| `POST` | `/chat/messages` | `send_message` |
| `PATCH` | `/chat/messages/:messageId` | `send_message` |
| `DELETE` | `/chat/messages/:messageId` | `delete_message` |
| `POST` | `/chat/messages/read` | `view_conversations` |

### Attachments

| Method | Path | Permission |
|--------|------|------------|
| `POST` | `/chat/threads/:threadId/attachments/upload-url` | `send_message` |

---

## 6.6 — Inbox response

Each inbox item includes:

- Thread metadata
- Last message preview
- Unread count
- Listing preview (title, price, image)
- Participant preview (name, avatar, verification badge)

Cached in Redis (30s TTL).

---

## 6.7 — System messages

Auto-posted on domain events:

| Event | Message |
|-------|---------|
| Listing sold | Listing marked as sold |
| Seller verification approved | Verification approved |
| Payment created | Payment initiated |

---

## 6.8 — Admin moderation

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/admin/chat/threads/:threadId` | `moderate_chat` |
| `GET` | `/admin/chat/messages/search?q=` | `moderate_chat` |
| `POST` | `/admin/chat/messages/:messageId/flag` | `flag_message` |
| `POST` | `/admin/chat/ban` | `ban_from_chat` |

---

## 6.9 — Notifications (FCM)

Triggered when user settings allow (`messageAlerts`, `push`):

| Event | Notification type |
|-------|-------------------|
| New message | `new_message` |
| Thread created (seller) | `thread_created` |
| Messages read | `message_read` |

---

## Error cases

| Status | When |
|--------|------|
| `400` | Invalid payload, self-thread, system message edit |
| `401` | Missing JWT (REST or WS) |
| `403` | Not a participant, chat ban, wrong role |
| `404` | Thread/message/listing not found |

---

## Frontend routes

| Role | Path |
|------|------|
| BUYER | `/account/messages` |
| SELLER | `/account/messages` |
| MEMBER | `/account/messages` |

---

## Related

- Types: `packages/types/src/chat-message.ts`
- Validation: `packages/validation/src/chat-message.schema.ts`
- Prisma: `ChatThread`, `ChatMessage`, `ChatMessageFlag`, `ChatBan`
