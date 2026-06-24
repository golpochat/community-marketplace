# Sequence Diagrams

> **Status:** Placeholder — align with implemented API endpoints.

## 1. Registration with email activation

```mermaid
sequenceDiagram
    actor User
    participant Web as apps/web
    participant API as auth module
    participant OTP as OtpService
    participant Email as EmailActivationService
    participant DB as PostgreSQL

    User->>Web: Submit register form
    Web->>API: POST /api/auth/register
    API->>DB: Create user (pending)
    API->>Email: createActivation(userId, email)
    Email-->>API: activation token
    API-->>Web: { accessToken, refreshToken, user }
    API->>User: Send activation email (async)
    User->>Web: Click activation link
    Web->>API: POST /api/auth/activate { token }
    API->>Email: activate(token)
    Email->>DB: Mark email verified
    API-->>Web: { activated: true }
```

## 2. OTP login

```mermaid
sequenceDiagram
    actor User
    participant Web as apps/web
    participant API as auth module
    participant OTP as OtpService
    participant JWT as JwtAuthService

    User->>Web: Enter email
    Web->>API: POST /api/auth/otp/send
    API->>OTP: sendOtp({ email, purpose: login })
    OTP-->>API: OtpEntity
    API-->>Web: { expiresInSeconds }
    User->>Web: Enter OTP code
    Web->>API: POST /api/auth/otp/verify
    API->>OTP: verifyOtp(dto)
    OTP-->>API: verified
    API->>JWT: issueTokens(user)
    JWT-->>API: tokens
    API-->>Web: { accessToken, refreshToken, user }
```

## 3. Create listing with search indexing

```mermaid
sequenceDiagram
    actor Seller
    participant Web as apps/web
    participant API as listings module
    participant Search as search module
    participant Meili as Meilisearch
    participant DB as PostgreSQL

    Seller->>Web: Create listing form
    Web->>API: POST /api/listings
    API->>DB: Insert listing
    API-->>Web: Listing
    API->>Search: index listing (event)
    Search->>Meili: addDocuments(index, doc)
    Meili-->>Search: task accepted
```

## 4. Stripe Connect payment

```mermaid
sequenceDiagram
    actor Buyer
    participant Web as apps/web
    participant API as payments module
    participant Stripe as Stripe Connect
    participant Notif as notifications module
    participant FCM as FcmService

    Buyer->>Web: Pay for listing
    Web->>API: POST /api/payments
    API->>Stripe: createPaymentIntent(amount, connectedAccount)
    Stripe-->>API: { clientSecret, paymentIntentId }
    API-->>Web: Payment (pending)
    Web->>Stripe: Confirm payment (client-side)
    Stripe->>API: Webhook payment_intent.succeeded
    API->>API: markCompleted(paymentId)
    API->>Notif: send payment_received
    Notif->>FCM: push to seller device
```

## 5. Real-time chat

```mermaid
sequenceDiagram
    actor Buyer
    actor Seller
    participant WebB as web (buyer)
    participant WebS as web (seller)
    participant GW as ChatGateway
    participant Chat as chat module
    participant DB as PostgreSQL

    Buyer->>WebB: Open conversation
    WebB->>GW: WS join { userId }
    Buyer->>WebB: Send message
    WebB->>GW: send_message
    GW->>Chat: sendMessage(dto)
    Chat->>DB: Persist message
    Chat-->>GW: ChatMessage
    GW->>WebS: emit message
    GW->>WebB: emit message_sent
```

## Diagram index

| # | Flow | Primary module |
|---|------|----------------|
| 1 | Email activation | `auth` |
| 2 | OTP login | `auth` |
| 3 | Listing + search index | `listings`, `search` |
| 4 | Stripe payment | `payments`, `notifications` |
| 5 | WebSocket chat | `chat` |
