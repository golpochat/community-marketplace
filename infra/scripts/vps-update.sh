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
# The "container is not connected to the network cm-network" error that Docker
# intermittently throws on recreate is handled automatically: any service that
# fails to come up is retried with --force-recreate, and Traefik is re-synced
# afterwards so its router view matches the recreated containers.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
GIT_BRANCH="${GIT_BRANCH:-main}"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

# Set to 1 whenever a service had to be force-recreated due to Docker leaving a
# stale container attached to cm-network. Used to trigger a Traefik re-sync.
FORCED_RECREATE=0

# Bring up the given services, retrying with --force-recreate if Docker reports
# a stale "not connected to the network" container.
up_services() {
  if compose up -d "$@"; then
    return 0
  fi
  echo "==> Stale container network detected — force-recreating: $*"
  FORCED_RECREATE=1
  compose up -d --force-recreate "$@"
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
  up_services --remove-orphans postgres redis

  if ! wait_for_postgres; then
    echo "==> Postgres not ready — forcing recreate"
    FORCED_RECREATE=1
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
up_services api worker web

if [[ "$FORCED_RECREATE" == "1" ]]; then
  echo "==> Re-syncing Traefik (a service was force-recreated)"
  compose up -d --force-recreate traefik
fi

echo "==> Health check (inside api container)"
sleep 5
compose exec -T api wget -qO- http://localhost:4000/api/health/ready | head -c 200
echo ""
echo "==> Done. Verify: curl -s https://api.\${DOMAIN:-sellnearby.ie}/api/health/ready"
