# Runbook: Deploy

## Prerequisites

- `kubectl` configured for target cluster
- GitHub Actions secrets configured
- Database migration path reviewed

## Development

**Automatic:** merge to `develop` triggers `deploy-dev.yml`.

**Manual (Docker):**

```bash
./infra/scripts/deploy.sh dev
./infra/scripts/migrate.sh dev
curl http://localhost:4000/api/health/ready
```

**Manual (K8s):**

```bash
kubectl apply -k infra/k8s/overlays/dev
kubectl rollout status deployment/dev-api -n community-marketplace
```

## Staging

**Automatic:** merge to `main` triggers `deploy-staging.yml`.

**Verify:**

```bash
curl https://api.staging.community.market/api/health/ready
```

## Production

1. Ensure staging smoke tests pass
2. GitHub → Actions → **Deploy Production**
3. Input `deploy` to confirm
4. Monitor rollout:

```bash
kubectl rollout status deployment/prod-api -n community-marketplace --timeout=600s
```

5. Post-deploy checklist:
   - [ ] `/api/health/ready` OK
   - [ ] Login smoke test
   - [ ] Grafana error rate normal
   - [ ] Queue depth stable

## Migrations

Migrations run in CI before image deploy (`prisma migrate deploy`). For manual:

```bash
DATABASE_URL=... ./infra/scripts/migrate.sh prod
```

## Related

- [Infrastructure](../infrastructure/README.md)
- [Rollback](./rollback.md)
