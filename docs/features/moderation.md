# Moderation Module

> **Feature:** Reports, actions, appeals · **API:** [moderation.md](../api/moderation.md)

## Functional requirements

- Unified reports (users, listings, messages)
- Automated content checks with auto-flag
- Moderator actions: warn, suspend, ban
- Appeals workflow with status tracking
- Moderation audit log
- Analytics dashboard (Redis-cached)
- Scheduled suspension lift via BullMQ

## Non-functional requirements

- Action audit immutable log
- Analytics cache TTL 60–120s
- Hidden listings via `moderationHiddenAt`

## User flows

```mermaid
flowchart TD
  REPORT[User reports] --> AUTO[Content check]
  AUTO --> QUEUE[Moderator queue]
  QUEUE --> ACTION[Action taken]
  ACTION --> NOTIFY[Notify user]
  ACTION --> APPEAL[Appeal optional]
```

## Edge cases

| Case | Behavior |
|------|----------|
| Duplicate report | Link or ignore per policy |
| Suspension expiry | Job lifts suspension |
| Appeal approved | Reverse action where applicable |

## Acceptance criteria

- [ ] User can report listing and see confirmation
- [ ] Admin can assign report and take action
- [ ] Analytics reflect open/resolved counts

## Related

- [Admin — Listings moderation](../admin/listings-moderation.md)
