# Runbook: Restore Backup

## Prerequisites

- Backup directory from `infra/scripts/backup.sh`
- Maintenance window announced
- Application traffic drained or stopped

## Steps

```bash
# 1. Stop app tier (K8s)
kubectl scale deployment/prod-api --replicas=0 -n community-marketplace

# 2. Restore
./infra/scripts/restore.sh ./backups/2026-06-24_120000

# 3. Verify Postgres
docker compose -f infra/docker/docker-compose.dev.yml exec postgres \
  psql -U cm -d community_marketplace -c "SELECT COUNT(*) FROM users;"

# 4. Restart services
./infra/scripts/deploy.sh prod
# or kubectl scale deployment/prod-api --replicas=2

# 5. Smoke test
curl https://api.community.market/api/health/ready
```

## R2 restore

If R2 backup included in manifest:

```bash
aws s3 sync ./backups/<date>/r2/ s3://$R2_BUCKET/ --endpoint-url $R2_ENDPOINT
```

## Meilisearch

After DB restore, trigger full reindex from admin Search screen or:

```http
POST /api/admin/search/reindex
Authorization: Bearer <admin_token>
```

## Related

- [Infrastructure — Backups](../infrastructure/README.md)
