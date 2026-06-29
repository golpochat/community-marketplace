#!/usr/bin/env bash
# Pull latest code on the OVH VPS and redeploy the pilot stack.
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   git pull origin main
#   ./infra/scripts/vps-update.sh
#
# Optional:
#   GIT_BRANCH=main SKIP_BUILD=1 ./infra/scripts/vps-update.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
GIT_BRANCH="${GIT_BRANCH:-main}"

cd "$ROOT_DIR"

if [[ "${SKIP_PULL:-0}" != "1" ]]; then
  echo "==> Pulling latest from origin/$GIT_BRANCH"
  git fetch origin "$GIT_BRANCH"
  git pull --ff-only origin "$GIT_BRANCH"
fi

cd "$COMPOSE_DIR"

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  echo "==> Skipping image build (SKIP_BUILD=1)"
else
  echo "==> Building api, worker, web"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build api worker web
fi

echo "==> Applying database migrations"
docker build -f "$ROOT_DIR/infra/docker/Dockerfile.api" --target builder -t cm-api-migrate "$ROOT_DIR"
# shellcheck disable=SC1091
set -a && source "$COMPOSE_DIR/$ENV_FILE" && set +a
docker run --rm \
  --network "community-marketplace-prod_cm-network" \
  -e "DATABASE_URL=postgresql://cm:${POSTGRES_PASSWORD}@postgres:5432/community_marketplace" \
  cm-api-migrate \
  sh -c "cd apps/api && pnpm exec prisma migrate deploy"

echo "==> Restarting app services"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api worker web

echo "==> Health check (local)"
sleep 3
curl -sf http://localhost:4000/api/health/ready | head -c 200
echo ""
echo "==> Done. Verify: curl -s https://api.\${DOMAIN:-sellnearby.ie}/api/health/ready"
