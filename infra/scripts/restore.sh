#!/usr/bin/env bash
# restore.sh — Restore Community Marketplace from a backup
# Usage: ./infra/scripts/restore.sh <backup_dir>
#   backup_dir: folder created by backup.sh

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_dir>"
  echo "Example: $0 ./backups/2026-06-24_120000"
  exit 1
fi

BACKUP_DIR="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.dev.yml"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "ERROR: Backup directory not found: ${BACKUP_DIR}"
  exit 1
fi

echo "==> Community Marketplace restore"
echo "    Source: ${BACKUP_DIR}"
echo ""
echo "WARNING: This will overwrite existing data. Press Ctrl+C to abort."
sleep 5

# ── Start infrastructure services ─────────────────────────────────────────────
echo "==> Starting infrastructure services..."
docker compose -f "${COMPOSE_FILE}" up -d postgres redis meilisearch
sleep 5

# ── PostgreSQL restore ──────────────────────────────────────────────────────
if [[ -f "${BACKUP_DIR}/postgres.sql.gz" ]]; then
  echo "==> Restoring PostgreSQL..."
  gunzip -c "${BACKUP_DIR}/postgres.sql.gz" \
    | docker compose -f "${COMPOSE_FILE}" exec -T postgres \
        psql -U cm community_marketplace
  echo "PostgreSQL restored."
else
  echo "WARN: postgres.sql.gz not found — skipping"
fi

# ── Meilisearch restore ───────────────────────────────────────────────────────
if [[ -f "${BACKUP_DIR}/meilisearch-data.tar.gz" ]]; then
  echo "==> Restoring Meilisearch data volume..."
  MEILI_VOLUME="community-marketplace_meili_data"
  docker compose -f "${COMPOSE_FILE}" stop meilisearch
  docker run --rm \
    -v "${MEILI_VOLUME}:/data" \
    -v "$(realpath "${BACKUP_DIR}"):/backup:ro" \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/meilisearch-data.tar.gz -C /data"
  docker compose -f "${COMPOSE_FILE}" start meilisearch
  echo "Meilisearch restored."
else
  echo "WARN: meilisearch-data.tar.gz not found — skipping"
fi

# ── Redis restore ─────────────────────────────────────────────────────────────
if [[ -f "${BACKUP_DIR}/redis-data.tar.gz" ]]; then
  echo "==> Restoring Redis data volume..."
  REDIS_VOLUME="community-marketplace_redis_data"
  docker compose -f "${COMPOSE_FILE}" stop redis
  docker run --rm \
    -v "${REDIS_VOLUME}:/data" \
    -v "$(realpath "${BACKUP_DIR}"):/backup:ro" \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/redis-data.tar.gz -C /data"
  docker compose -f "${COMPOSE_FILE}" start redis
  echo "Redis restored."
else
  echo "WARN: redis-data.tar.gz not found — skipping"
fi

echo "==> Restore complete from ${BACKUP_DIR}"
echo "    Run ./infra/scripts/deploy.sh to restart application services."
