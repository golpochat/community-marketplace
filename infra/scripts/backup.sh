#!/usr/bin/env bash
# backup.sh — Backup Community Marketplace data stores
# Usage: ./infra/scripts/backup.sh [backup_dir]
#   backup_dir: destination folder (default: ./backups/YYYY-MM-DD)

set -euo pipefail

BACKUP_DIR="${1:-./backups/$(date +%Y-%m-%d_%H%M%S)}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.dev.yml"

echo "==> Community Marketplace backup"
echo "    Destination: ${BACKUP_DIR}"

mkdir -p "${BACKUP_DIR}"

# ── PostgreSQL ────────────────────────────────────────────────────────────────
echo "==> Backing up PostgreSQL..."
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U cm community_marketplace \
  | gzip > "${BACKUP_DIR}/postgres.sql.gz" \
  || echo "WARN: PostgreSQL backup skipped (container not running)"

# ── Meilisearch ───────────────────────────────────────────────────────────────
echo "==> Backing up Meilisearch dumps..."
docker compose -f "${COMPOSE_FILE}" exec -T meilisearch \
  meilisearch --dump-dir /meili_data/dumps 2>/dev/null \
  || echo "WARN: Meilisearch dump skipped (container not running)"

MEILI_VOLUME="community-marketplace_meili_data"
docker run --rm \
  -v "${MEILI_VOLUME}:/data:ro" \
  -v "$(realpath "${BACKUP_DIR}"):/backup" \
  alpine tar czf /backup/meilisearch-data.tar.gz -C /data . \
  2>/dev/null || echo "WARN: Meilisearch volume backup skipped"

# ── Redis ─────────────────────────────────────────────────────────────────────
echo "==> Backing up Redis..."
docker compose -f "${COMPOSE_FILE}" exec -T redis \
  redis-cli BGSAVE 2>/dev/null \
  || echo "WARN: Redis backup skipped (container not running)"

REDIS_VOLUME="community-marketplace_redis_data"
docker run --rm \
  -v "${REDIS_VOLUME}:/data:ro" \
  -v "$(realpath "${BACKUP_DIR}"):/backup" \
  alpine tar czf /backup/redis-data.tar.gz -C /data . \
  2>/dev/null || echo "WARN: Redis volume backup skipped"

# R2 backup (when AWS CLI configured for R2)
if command -v aws >/dev/null 2>&1 && [[ -n "${R2_BUCKET:-}" ]]; then
  echo "==> Backing up R2 bucket prefix snapshots..."
  aws s3 sync "s3://${R2_BUCKET}/" "${BACKUP_DIR}/r2/" \
    --endpoint-url "${R2_ENDPOINT:-}" \
    2>/dev/null || echo "WARN: R2 backup skipped"
fi

# ── Manifest ──────────────────────────────────────────────────────────────────
cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${NODE_ENV:-unknown}",
  "components": ["postgres", "meilisearch", "redis", "r2"],
  "version": "$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

echo "==> Backup complete: ${BACKUP_DIR}"
ls -lh "${BACKUP_DIR}"
