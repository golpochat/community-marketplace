#!/usr/bin/env bash
# Seed 50 pilot listings across existing + filler seller accounts on production.
# Prefers live sellers/buyers already registered; fills gaps with pilot filler accounts.
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   git pull
#   ./infra/scripts/seed-pilot-data-prod-docker.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$COMPOSE_DIR/.env.prod}"
MIGRATE_IMAGE="${MIGRATE_IMAGE:-cm-api-migrate}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE — copy from .env.prod.example first."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

if [[ -z "${POSTGRES_PASSWORD:-}" || -z "${JWT_SECRET:-}" ]]; then
  echo "ERROR: POSTGRES_PASSWORD and JWT_SECRET must be set in $ENV_FILE"
  exit 1
fi

cd "$COMPOSE_DIR"

echo "==> Ensuring postgres is up"
docker compose -f "$COMPOSE_FILE" --env-file .env.prod up -d postgres
for _ in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" --env-file .env.prod exec -T postgres pg_isready -U cm >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker image inspect "$MIGRATE_IMAGE" >/dev/null 2>&1; then
  echo "==> Building $MIGRATE_IMAGE (builder stage)"
  docker build -f "$ROOT_DIR/infra/docker/Dockerfile.api" --target builder -t "$MIGRATE_IMAGE" "$ROOT_DIR"
fi

POSTGRES_CID="$(docker compose -f "$COMPOSE_FILE" --env-file .env.prod ps -q postgres | head -1)"
NETWORK="$(docker inspect "$POSTGRES_CID" -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"

echo "==> Seeding pilot listings (existing users preferred, unique images)"
docker run --rm \
  --network "$NETWORK" \
  -e NODE_ENV=production \
  -e RBAC_SEED_ENABLED=true \
  -e RBAC_SEED_FORCE=true \
  -e PILOT_USE_EXISTING_USERS=true \
  -e "DATABASE_URL=postgresql://cm:${POSTGRES_PASSWORD}@postgres:5432/community_marketplace" \
  -e "JWT_SECRET=${JWT_SECRET}" \
  "$MIGRATE_IMAGE" \
  sh -c "cd apps/api && pnpm run seed:pilot-data"

echo "==> Done. Browse https://${DOMAIN:-sellnearby.ie}/listings"
echo "    Filler pilot accounts (if created) use password: ChangeMe!Pilot1"
