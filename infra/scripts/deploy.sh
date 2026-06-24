#!/usr/bin/env bash
# deploy.sh — Deploy Community Marketplace stack
# Usage: ./infra/scripts/deploy.sh [environment]
#   environment: dev | prod  (default: dev)

set -euo pipefail

ENV="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

case "${ENV}" in
  dev)
    COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.dev.yml"
    ;;
  prod)
    COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.prod.yml"
    ;;
  *)
    echo "Unknown environment: ${ENV} (use dev or prod)"
    exit 1
    ;;
esac

echo "==> Deploying community-marketplace [${ENV}]"

command -v docker >/dev/null 2>&1 || { echo "docker is required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required"; exit 1; }

cd "${ROOT_DIR}"
pnpm --filter "./packages/*" build
pnpm --filter "./apps/*" build

docker compose -f "${COMPOSE_FILE}" build
docker compose -f "${COMPOSE_FILE}" up -d

echo "==> Running migrations..."
"${ROOT_DIR}/infra/scripts/migrate.sh" "${ENV}" || echo "WARN: migrations skipped"

sleep 10
curl -sf http://localhost:4000/api/health/ready && echo "API ready" || echo "API not ready yet"

echo "==> Deploy complete [${ENV}]"
