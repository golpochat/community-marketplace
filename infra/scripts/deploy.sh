#!/usr/bin/env bash
# deploy.sh — Deploy Community Marketplace stack
# Usage: ./infra/scripts/deploy.sh [environment]
#   environment: dev | staging | prod  (default: dev)

set -euo pipefail

ENV="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.yml"

echo "==> Deploying community-marketplace [${ENV}]"
echo "    Root: ${ROOT_DIR}"

# ── Pre-flight checks ─────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "docker is required"; exit 1; }
command -v pnpm    >/dev/null 2>&1 || { echo "pnpm is required for local builds"; exit 1; }

# ── Build shared packages & apps ──────────────────────────────────────────────
cd "${ROOT_DIR}"
echo "==> Building monorepo..."
pnpm --filter "./packages/*" build
pnpm --filter "./apps/*" build

# ── Docker images ─────────────────────────────────────────────────────────────
echo "==> Building Docker images..."
docker compose -f "${COMPOSE_FILE}" build \
  api web admin meilisearch

# ── Deploy ────────────────────────────────────────────────────────────────────
echo "==> Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d

# ── Health checks ─────────────────────────────────────────────────────────────
echo "==> Waiting for health checks..."
sleep 10
curl -sf http://localhost/api/health 2>/dev/null \
  && echo "API: healthy" \
  || echo "API: not reachable (may need Traefik routing)"

echo "==> Deploy complete [${ENV}]"
echo "    Web:   http://localhost"
echo "    Admin: http://admin.localhost"
echo "    API:   http://api.localhost/api/health"
echo "    Traefik dashboard: http://localhost:8080"
