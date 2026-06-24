# Chat API

> **Status:** Placeholder — REST base `/api/chat`, WebSocket namespace `/chat`

## Overview

Real-time messaging between buyers and sellers, scoped to listings and conversations.

## REST endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/conversations` | Required | List user conversations |
| `POST` | `/conversations` | Required | Start / join conversation |
| `GET` | `/conversations/:id/messages` | Required | Message history |
| `POST` | `/messages` | Required | Send message (REST fallback) |
| `POST` | `/messages/read` | Required | Mark conversation read |

## WebSocket events

Connect to: `ws://<host>/chat`

| Event (client → server) | Payload | Description |
|-------------------------|---------|-------------|
| `join` | `{ userId }` | Join user room |
| `send_message` | `SendMessageDto & { senderId }` | Send message |
| `mark_read` | `{ userId, conversationId }` | Mark read |

| Event (server → client) | Description |
|-------------------------|-------------|
| `message` | New message received |
| `message_sent` | Delivery confirmation |

## Send message

```http
POST /api/chat/messages
Authorization: Bearer <token>

{
  "conversationId": "conv-123",
  "recipientId": "user-seller",
  "listingId": "listing-456",
  "type": "text",
  "content": "Is this still available?"
}
```

## Message types

| Type | Description |
|------|-------------|
| `text` | Plain text message |
| `image` | Image attachment (URL in content) |
| `system` | Automated system message |

## Message statuses

`sent` → `delivered` → `read`

## TODO

- [ ] Typing indicators WebSocket event
- [ ] Message pagination (cursor-based)
- [ ] Media upload for image messages
- [ ] Block / report integration with `moderation` module
