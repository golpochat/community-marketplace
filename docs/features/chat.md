# Chat Module

> **Feature:** Buyer–seller messaging · **API:** [chat.md](../api/chat.md)

## Functional requirements

- Thread per buyer–listing pair
- REST message history + WebSocket real-time delivery
- Read receipts, typing indicators (where implemented)
- System messages (payment updates, moderation)
- Admin thread view + message flagging
- Chat moderation (ban from chat)

## Non-functional requirements

- WebSocket auth via JWT
- Messages persisted before broadcast
- Rate limiting on message send

## User flows

See [Sequence Diagrams — Chat](../architecture/sequence-diagrams.md#5-real-time-chat).

## Edge cases

| Case | Behavior |
|------|----------|
| User chat-banned | Cannot send messages |
| Thread for sold listing | Read-only or archived per policy |
| Flagged message | Moderation queue |

## Acceptance criteria

- [ ] Buyer and seller receive messages in real time
- [ ] Admin can search messages and flag content
- [ ] Payment system message appears in thread

## Related

- [Notifications](./notifications.md)
