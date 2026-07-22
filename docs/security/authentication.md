# Authentication Security

## Token model

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access JWT | 15 min | Client memory / header |
| Refresh token | 7 days | HTTP-only cookie or body; hashed in DB |

## Flows

- Phone OTP with rate limiting (5 sends / 10 min)
- Email activation JWT (single-use, signed) — password required at activate; default role `MEMBER`
- Password forgot / reset / change
- Refresh rotation invalidates previous hash
- Brute-force tracking on login failures
- Pilot: `OTP_PILOT_MODE` (API logs codes) + `NEXT_PUBLIC_OTP_PILOT_MODE` (web banner)

## Session security

- Refresh tokens stored as SHA-256 hashes
- Logout revokes session row
- Suspended users cannot authenticate

## Related

- [features/authentication.md](../features/authentication.md)
- [api/auth.md](../api/auth.md)
