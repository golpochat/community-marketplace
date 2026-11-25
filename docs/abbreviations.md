# Abbreviations

> Living glossary for terms used in SellNearby docs, code, and ops notes.  
> Add a row when a new abbreviation shows up. Keep the table alphabetical. One line each.

| Abbreviation | Description |
|---|---|
| ACME | Certificate protocol used by Let's Encrypt to issue TLS certs |
| AI | Artificial intelligence; here, the seller Marketing Hub tools and credit packs |
| API | Application programming interface; the NestJS backend under `/api` |
| ARPU | Average revenue per user; seller spend on packs, slots, and featured placement |
| ASAP | As soon as possible |
| BEP | Break-even point; ops cash BEP means monthly platform fees cover lean burn (~€50–€100) |
| CAC | Customer acquisition cost |
| CDN | Content delivery network |
| CI | Continuous integration; lint, typecheck, and build on each change |
| CD | Continuous delivery; deploying a built image to an environment |
| CLI | Command-line interface |
| CNAME | DNS record that aliases one hostname to another |
| COGS | Cost of goods sold; direct cost of a sale, including AI model usage |
| CORS | Cross-origin resource sharing; which browser origins may call the API |
| CPM | Cost per thousand ad impressions |
| CRUD | Create, read, update, delete |
| CSP | Content Security Policy; browser header that limits what a page may load |
| CSRF | Cross-site request forgery; blocked here with a double-submit cookie |
| CSS | Cascading Style Sheets |
| CTA | Call to action; a button or link meant to be clicked |
| CTR | Click-through rate |
| DB | Database; PostgreSQL via Prisma |
| DKIM | DomainKeys Identified Mail; cryptographic signature that email came from our domain |
| DNS | Domain Name System |
| DO | DigitalOcean |
| DPO | Data protection officer |
| DPIA | Data protection impact assessment (GDPR) |
| E2E | End-to-end test of a full user flow |
| EEA | European Economic Area |
| EKS | Amazon Elastic Kubernetes Service |
| ERD | Entity-relationship diagram of the database |
| EU | European Union |
| EUR | Euro; catalog and checkout currency |
| FAQ | Frequently asked questions |
| FB | Facebook, including Facebook Marketplace |
| FCM | Firebase Cloud Messaging; push notifications (stubbed in the pilot) |
| FIFO | First in, first out; oldest item is handled first |
| FK | Foreign key |
| FR | Functional requirement (what the product must do) |
| GA4 | Google Analytics 4 |
| GDPR | General Data Protection Regulation |
| GKE | Google Kubernetes Engine |
| GMV | Gross merchandise value; card sales volume, not platform revenue |
| GSC | Google Search Console |
| GTM | Go-to-market; how the pilot is sold, starting with the Dublin concierge wedge |
| HEX | Hexadecimal color code |
| HPA | Horizontal Pod Autoscaler; Kubernetes scaling by load |
| HTML | HyperText Markup Language |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | HTTP over TLS |
| ID | Identifier |
| IP | Internet Protocol address |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token; short-lived access token |
| K8s | Kubernetes |
| KPI | Key performance indicator |
| KYC | Know your customer; identity checks, including Stripe Connect |
| LLM | Large language model; the AI Marketing Hub text backend |
| MAU | Monthly active users |
| MVP | Minimum viable product |
| NFR | Non-functional requirement (speed, uptime, security, and similar) |
| OG | Open Graph; tags that control link previews |
| OTP | One-time password |
| OVH | Host of the pilot VPS |
| OWASP | Open Worldwide Application Security Project; the Top 10 is the security baseline |
| P0 | Priority 0; broken flow, fix or workaround within 24 hours |
| P1 | Priority 1; ship now, or a confusing UX fix in the next deploy |
| P2 | Priority 2; strengthen next, or a feature request for the backlog |
| P3 | Priority 3; new content or listings needed |
| P4 | Priority 4; long-term or competitive head terms |
| PaaS | Platform as a service (Railway, Render, Fly, and similar) |
| PCI | Payment Card Industry; card data stays on Stripe (SAQ A) |
| PDF | Portable Document Format |
| PII | Personally identifiable information |
| PK | Primary key |
| PR | Pull request |
| PWA | Progressive web app; installable web client |
| QA | Quality assurance |
| R2 | Cloudflare R2; object storage for listing and profile images |
| RBAC | Role-based access control; permission codes, not only role names |
| REST | Representational state transfer; the HTTP API style |
| ROI | Return on investment |
| ROPA | Record of processing activities (GDPR) |
| RPO | Recovery point objective; how much data loss is acceptable |
| RTO | Recovery time objective; how fast service must be restored |
| S3 | Amazon Simple Storage Service; R2 speaks the same API |
| SAQ | Self-assessment questionnaire; PCI SAQ A because we do not store card numbers |
| SEO | Search engine optimization |
| Shop Shelf | Free live listing cap per storefront; over-cap uses Keep Live |
| SKU | Stock-keeping unit; a priced product such as a boost, featured slot, or credit pack |
| SLA | Service-level agreement; uptime or response-time promise |
| SMS | Short message service |
| SPF | Sender Policy Framework; DNS record of which servers may send our email |
| SRE | Site reliability engineering |
| SSH | Secure Shell; remote login to the VPS |
| SSL | Older name for transport encryption; we use TLS |
| SSR | Server-side rendering |
| TBD | To be decided |
| TLS | Transport Layer Security |
| TTL | Time to live; how long a cache entry or token stays valid |
| UI | User interface |
| UGC | User-generated content; listings and other member-written pages |
| URL | Uniform resource locator |
| USD | US dollar |
| UUID | Universally unique identifier |
| UX | User experience |
| VAT | Value-added tax |
| VPS | Virtual private server; pilot runs Docker Compose on an OVH VPS |
| WCAG | Web Content Accessibility Guidelines; target is Level AA |
| WS | WebSocket; real-time chat delivery |
| XSS | Cross-site scripting |
