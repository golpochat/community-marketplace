# Non-Functional Requirements

> **Status:** Placeholder — v0.1 draft

## Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P1 | API p95 response time (read) | < 200 ms |
| NFR-P2 | API p95 response time (write) | < 500 ms |
| NFR-P3 | WebSocket message delivery | < 100 ms |
| NFR-P4 | Search query response | < 150 ms |
| NFR-P5 | Web Lighthouse performance score | ≥ 85 |

## Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S1 | Concurrent API users | 10,000 |
| NFR-S2 | Horizontal API scaling | HPA 2–10 pods |
| NFR-S3 | Listing catalog size | 1M+ listings |
| NFR-S4 | Search index size | 1M+ documents |

## Availability & reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A1 | Uptime SLA | 99.9% |
| NFR-A2 | RPO (data loss) | < 1 hour |
| NFR-A3 | RTO (recovery) | < 4 hours |
| NFR-A4 | Automated health checks | All services |

## Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC1 | TLS everywhere | HTTPS only in prod |
| NFR-SEC2 | JWT access token expiry | 15 minutes |
| NFR-SEC3 | Password minimum length | 8 characters |
| NFR-SEC4 | OTP rate limiting | 5 attempts / 10 min |
| NFR-SEC5 | Admin IP allowlist | Traefik middleware |
| NFR-SEC6 | Secrets management | K8s secrets / vault |
| NFR-SEC7 | OWASP Top 10 compliance | Required |

## Maintainability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-M1 | Monorepo with shared packages | pnpm workspaces |
| NFR-M2 | TypeScript strict mode | All packages |
| NFR-M3 | API documentation | OpenAPI + markdown |
| NFR-M4 | Infrastructure as code | Docker + K8s manifests |

## Accessibility & UX

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U1 | WCAG compliance | Level AA |
| NFR-U2 | PWA installable | apps/web |
| NFR-U3 | Mobile responsive | All client apps |

## Observability (planned)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-O1 | Structured logging | JSON logs |
| NFR-O2 | Distributed tracing | OpenTelemetry |
| NFR-O3 | Error tracking | Sentry or equivalent |
| NFR-O4 | Metrics dashboard | Prometheus + Grafana |
