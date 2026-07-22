# Functional Requirements

> **Status:** Placeholder — v0.1 draft

## FR-1: User management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users can register with email and password | P0 |
| FR-1.2 | Users can log in via password or OTP | P0 |
| FR-1.3 | Users must activate email before full access | P1 |
| FR-1.4 | Users can update profile (name, avatar, bio, location) | P1 |
| FR-1.5 | Users can submit identity verification documents | P2 |
| FR-1.6 | Admins can suspend / activate user accounts | P1 |

## FR-2: Listings

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Sellers can create, edit, and delete draft/rejected listings; pause or end after publish | P0 |
| FR-2.2 | Buyers can browse and search listings | P0 |
| FR-2.3 | Listings support categories, images, and conditions | P0 |
| FR-2.4 | Listings have lifecycle states (draft → active → sold) | P1 |
| FR-2.5 | Admins can approve or reject listings | P2 |

## FR-3: Messaging

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Buyers can message sellers about a listing | P0 |
| FR-3.2 | Messages are delivered in real time (WebSocket) | P1 |
| FR-3.3 | Users can view conversation history | P0 |
| FR-3.4 | Users receive push notifications for new messages | P2 |

## FR-4: Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Buyers can pay for listings via card | P1 |
| FR-4.2 | Sellers onboard via Stripe Connect | P1 |
| FR-4.3 | Platform records payment status and history | P1 |
| FR-4.4 | Sellers receive payment notifications | P2 |

## FR-5: Search

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Users can full-text search listings | P1 |
| FR-5.2 | Search results are ranked by relevance | P2 |
| FR-5.3 | New listings are indexed automatically | P1 |

## FR-6: Moderation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Users can report listings, users, or messages | P1 |
| FR-6.2 | Admins can review and resolve reports | P1 |
| FR-6.3 | Admins can issue temporary or permanent bans | P1 |

## FR-7: Administration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Admins can view platform stats dashboard | P1 |
| FR-7.2 | Admins can manage users and listings | P1 |
| FR-7.3 | Admin actions are recorded in audit log | P2 |
