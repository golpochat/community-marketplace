# Runbook: Rollback

## When to rollback

- Elevated 5xx error rate after deploy
- Failed readiness probes
- Critical functional regression

## Kubernetes rollback

```bash
# View history
kubectl rollout history deployment/prod-api -n community-marketplace

# Rollback to previous revision
kubectl rollout undo deployment/prod-api -n community-marketplace

# Rollback to specific revision
kubectl rollout undo deployment/prod-api -n community-marketplace --to-revision=3

# Verify
kubectl rollout status deployment/prod-api -n community-marketplace
curl https://api.community.market/api/health/ready
```

Repeat for `web`, `admin`, `worker` deployments.

## Docker Compose rollback

```bash
# Re-tag previous images and redeploy
docker compose -f infra/docker/docker-compose.prod.yml up -d api web admin
```

## Database rollback

Prisma migrations are **forward-only**. To revert schema:

1. Restore DB from backup ([restore-backup.md](./restore-backup.md)), or
2. Ship a new migration that reverses changes

**Do not** run `migrate reset` in production.

## Communication

- Post in Slack via deploy workflow notification
- Document incident in postmortem

## Related

- [Deploy](./deploy.md)
