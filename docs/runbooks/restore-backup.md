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

## Kubernetes nightly dump

CronJob `postgres-backup` (02:00 UTC) writes `pg_dump` gzip files to PVC `postgres-backups` and deletes dumps older than 14 days. That is a logical restore path.

Point-in-time recovery uses a physical base backup plus archived WAL:

- Postgres runs with `wal_level=replica`, `archive_mode=on`, and copies WAL to PVC `postgres-wal-archive`.
- CronJob `postgres-basebackup` (01:00 UTC) runs `pg_basebackup -Ft -z -X none` to PVC `postgres-basebackups` (7-day retention). A sidecar on the Postgres pod deletes WAL files older than 14 days.
- Compose production mounts volume `postgres_wal_archive` with the same archive command.

```bash
# List physical backups and WAL
kubectl get cronjob postgres-basebackup -n community-marketplace
kubectl get pvc postgres-basebackups postgres-wal-archive -n community-marketplace
```

Restore to a timestamp (destructive — drain traffic first):

```bash
kubectl scale deployment/prod-api deployment/prod-worker --replicas=0 -n community-marketplace
kubectl scale statefulset/postgres --replicas=0 -n community-marketplace

# Restore the chosen base backup into the data PVC, then replay WAL.
# Example: extract base-YYYYMMDDTHHMMSSZ/base.tar.gz into PGDATA, write recovery.signal,
# and start Postgres with:
#   restore_command = 'cp /wal-archive/%f %p'
#   recovery_target_time = '2026-09-19 18:30:00 UTC'

kubectl scale statefulset/postgres --replicas=1 -n community-marketplace
kubectl scale deployment/prod-api --replicas=2 -n community-marketplace
```

Keep the nightly `pg_dump` path for logical restores when PITR is not required.

```bash
# List dumps
kubectl get cronjob postgres-backup -n community-marketplace
kubectl get pvc postgres-backups -n community-marketplace

# Restore the latest dump (destructive — take a maintenance window)
kubectl scale deployment/prod-api --replicas=0 -n community-marketplace
kubectl exec -n community-marketplace <backup-pod> -- cat /backups/postgres-YYYYMMDDThhmmssZ.sql.gz \
  | gunzip | kubectl exec -i -n community-marketplace sts/postgres -- psql -U cm community_marketplace
kubectl scale deployment/prod-api --replicas=2 -n community-marketplace
```

## Related

- [Infrastructure — Backups](../infrastructure/README.md)
