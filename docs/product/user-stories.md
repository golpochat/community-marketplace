# User Stories

> **Status:** Placeholder — organized by persona.

## Buyer

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-B01 | As a buyer, I want to browse listings so I can find items in my community | Paginated listing feed with images and prices |
| US-B02 | As a buyer, I want to search listings so I can find specific items quickly | Full-text search returns relevant results |
| US-B03 | As a buyer, I want to message a seller so I can ask questions before buying | Chat opens from listing detail page |
| US-B04 | As a buyer, I want to pay securely so I can complete a purchase | Stripe payment flow with confirmation |
| US-B05 | As a buyer, I want to receive notifications so I know when a seller replies | Push notification on new message |
| US-B06 | As a buyer, I want to report a listing so I can flag inappropriate content | Report form with reason selection |

## Seller

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-S01 | As a seller, I want to create a listing so I can sell items locally | Form with title, price, photos, category |
| US-S02 | As a seller, I want to manage my listings so I can update or remove them | Dashboard shows all seller listings |
| US-S03 | As a seller, I want to onboard with Stripe so I can receive payments | Connect onboarding flow completes |
| US-S04 | As a seller, I want to see payment history so I can track earnings | Payments list with status and amounts |
| US-S05 | As a seller, I want to respond to buyer messages in real time | WebSocket chat with delivery status |

## Admin

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-A01 | As an admin, I want a dashboard so I can see platform health at a glance | Stats: users, listings, reports, revenue |
| US-A02 | As an admin, I want to review reports so I can take moderation action | Report queue with resolve/dismiss |
| US-A03 | As an admin, I want to ban users so I can protect the community | Ban with reason, temp or permanent |
| US-A04 | As an admin, I want an audit log so I can track admin actions | Timestamped log of all admin operations |

## Authentication (all users)

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-X01 | As a user, I want to register with email so I can join the marketplace | Registration returns tokens |
| US-X02 | As a user, I want OTP login so I can sign in without a password | OTP sent and verified within 10 min |
| US-X03 | As a user, I want to activate my email so my account is verified | Activation link marks email as verified |
