#!/usr/bin/env bash
# Pull latest code on the OVH VPS and redeploy the pilot stack.
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   git pull origin main
#   ./infra/scripts/vps-update.sh
#
# Optional:
#   GIT_BRANCH=main SKIP_BUILD=1 SKIP_PULL=1 ./infra/scripts/vps-update.sh
#
# If docker reports a container is "not connected to the network", run once:
#   cd /opt/sellnearby/infra/docker
#   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate postgres redis

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
GIT_BRANCH="${GIT_BRANCH:-main}"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

wait_for_postgres() {
  for _ in $(seq 1 30); do
    if compose exec -T postgres pg_isready -U cm >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

ensure_postgres_redis() {
  echo "==> Ensuring postgres and redis are up"
  if ! compose up -d --remove-orphans postgres redis; then
    echo "==> Recreating postgres/redis (stale container network)"
    compose up -d --force-recreate postgres redis
  fi

  if ! wait_for_postgres; then
    echo "==> Postgres not ready — forcing recreate"
    compose up -d --force-recreate postgres redis
    wait_for_postgres
  fi
}

cd "$ROOT_DIR"

if [[ "${SKIP_PULL:-0}" != "1" ]]; then
  echo "==> Pulling latest from origin/$GIT_BRANCH"
  git fetch origin "$GIT_BRANCH"
  git pull --ff-only origin "$GIT_BRANCH"
fi

cd "$COMPOSE_DIR"

# shellcheck disable=SC1091
set -a && source "$ENV_FILE" && set +a

ensure_postgres_redis

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  echo "==> Skipping image build (SKIP_BUILD=1)"
else
  echo "==> Building api, worker, web"
  compose build api worker web
fi

echo "==> Applying database migrations (Prisma 6 via builder image)"
docker build -f "$ROOT_DIR/infra/docker/Dockerfile.api" --target builder -t cm-api-migrate "$ROOT_DIR"

POSTGRES_CID="$(compose ps -q postgres | head -1)"
if [[ -z "$POSTGRES_CID" ]]; then
  echo "ERROR: postgres container not found"
  exit 1
fi

NETWORK="$(docker inspect "$POSTGRES_CID" -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
if [[ -z "$NETWORK" ]]; then
  echo "ERROR: could not resolve docker network for postgres"
  exit 1
fi

docker run --rm \
  --network "$NETWORK" \
  -e "DATABASE_URL=postgresql://cm:${POSTGRES_PASSWORD}@postgres:5432/community_marketplace" \
  cm-api-migrate \
  sh -c "cd apps/api && pnpm exec prisma migrate deploy"

echo "==> Restarting app services"
compose up -d api worker web

echo "==> Health check (inside api container)"
sleep 5
compose exec -T api wget -qO- http://localhost:4000/api/health/ready | head -c 200
echo ""
echo "==> Done. Verify: curl -s https://api.\${DOMAIN:-sellnearby.ie}/api/health/ready"
