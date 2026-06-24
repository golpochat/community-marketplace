# Deployment Architecture

> **Category:** Architecture

End-to-end deployment: GitHub Actions → container registry → Kubernetes → Traefik ingress.

```mermaid
flowchart TB
  subgraph CI[GitHub Actions]
    BUILD[build.yml]
    DEPLOY_DEV[deploy-dev.yml]
    DEPLOY_STG[deploy-staging.yml]
    DEPLOY_PROD[deploy-prod.yml]
  end

  subgraph Registry
    GHCR[ghcr.io images]
  end

  subgraph K8s[Kubernetes Cluster]
    ING[Ingress / Traefik]
    API_POD[API Deployment]
    WEB_POD[Web Deployment]
    ADMIN_POD[Admin Deployment]
    WORKER_POD[Worker Deployment]
    DATA[(Postgres + Redis + Meili)]
  end

  BUILD --> GHCR
  DEPLOY_DEV & DEPLOY_STG & DEPLOY_PROD --> GHCR
  DEPLOY_DEV & DEPLOY_STG & DEPLOY_PROD --> K8s
  ING --> WEB_POD & ADMIN_POD & API_POD
  API_POD & WORKER_POD --> DATA
```

## Environment matrix

| Env | Branch trigger | Namespace | Overlay |
|-----|----------------|-----------|---------|
| Development | `develop` | `community-marketplace` | `overlays/dev` |
| Staging | `main` | `community-marketplace-staging` | `overlays/staging` |
| Production | Manual workflow | `community-marketplace` | `overlays/prod` |

## TLS & routing

- Traefik terminates TLS (Let's Encrypt ACME)
- Host-based routing: `api.*`, `community.market`, `admin.*`
- Middlewares: rate limit, compression, security headers

## Post-deploy verification

1. `kubectl rollout status deployment/<env>-api`
2. `curl https://api.<domain>/api/health/ready`
3. Grafana: error rate, latency, `bullmq_queue_waiting`
4. Smoke test: login, listing search, admin dashboard

## Related

- [Infrastructure](../infrastructure/README.md)
- [Deploy runbook](../runbooks/deploy.md)
- [Rollback runbook](../runbooks/rollback.md)
