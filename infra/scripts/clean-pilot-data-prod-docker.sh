#!/usr/bin/env bash
# Clean pilot data issues on production (delivery conflicts, bad images, [Pilot] titles).
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   git pull --ff-only origin main
#   ./infra/scripts/clean-pilot-data-prod-docker.sh
#   DRY_RUN=1 ./infra/scripts/clean-pilot-data-prod-docker.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$COMPOSE_DIR/.env.prod}"
MIGRATE_IMAGE="${MIGRATE_IMAGE:-cm-api-migrate}"
DRY_RUN="${DRY_RUN:-0}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

cd "$COMPOSE_DIR"

echo "==> Ensuring postgres is up"
docker compose -f "$COMPOSE_FILE" --env-file .env.prod up -d postgres
for _ in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" --env-file .env.prod exec -T postgres pg_isready -U cm >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Building $MIGRATE_IMAGE (builder) for cleanup scripts"
docker build -f "$ROOT_DIR/infra/docker/Dockerfile.api" --target builder -t "$MIGRATE_IMAGE" "$ROOT_DIR"

POSTGRES_CID="$(docker compose -f "$COMPOSE_FILE" --env-file .env.prod ps -q postgres | head -1)"
NETWORK="$(docker inspect "$POSTGRES_CID" -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"

run_clean() {
  local script="$1"
  echo "==> Running $script (DRY_RUN=$DRY_RUN)"
  docker run --rm \
    --network "$NETWORK" \
    -e NODE_ENV=production \
    -e "DRY_RUN=${DRY_RUN}" \
    -e "DATABASE_URL=postgresql://cm:${POSTGRES_PASSWORD}@postgres:5432/community_marketplace" \
    -e "JWT_SECRET=${JWT_SECRET}" \
    -e "WEB_APP_URL=${WEB_APP_URL:-https://sellnearby.ie}" \
    -e "REVALIDATE_SECRET=${REVALIDATE_SECRET:-}" \
    "$MIGRATE_IMAGE" \
    sh -c "cd apps/api && pnpm exec ts-node -P tsconfig.scripts.json scripts/${script}"
}

run_clean clean-listing-delivery-conflicts.ts
run_clean clean-pilot-listing-images.ts
run_clean clean-pilot-listing-titles.ts

echo "==> Done. Hard-refresh listing pages or wait for revalidate."
