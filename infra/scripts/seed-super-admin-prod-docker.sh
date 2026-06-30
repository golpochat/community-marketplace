#!/usr/bin/env bash
# Create bootstrap SUPER_ADMIN user on production (one-time).
# Reads credentials from infra/docker/.env.prod — does not enable runtime seeding.
#
# Prerequisites:
#   1. Roles seeded: ./infra/scripts/seed-rbac-prod-docker.sh
#   2. .env.prod contains RBAC_SUPER_ADMIN_EMAIL, RBAC_SUPER_ADMIN_PASSWORD,
#      RBAC_SUPER_ADMIN_DISPLAY_NAME (quote display name if it contains spaces)
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   nano infra/docker/.env.prod   # set the three RBAC_SUPER_ADMIN_* values
#   ./infra/scripts/seed-super-admin-prod-docker.sh

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

missing=()
[[ -z "${RBAC_SUPER_ADMIN_EMAIL:-}" ]] && missing+=("RBAC_SUPER_ADMIN_EMAIL")
[[ -z "${RBAC_SUPER_ADMIN_PASSWORD:-}" ]] && missing+=("RBAC_SUPER_ADMIN_PASSWORD")
[[ -z "${RBAC_SUPER_ADMIN_DISPLAY_NAME:-}" ]] && missing+=("RBAC_SUPER_ADMIN_DISPLAY_NAME")
[[ -z "${POSTGRES_PASSWORD:-}" ]] && missing+=("POSTGRES_PASSWORD")
[[ -z "${JWT_SECRET:-}" ]] && missing+=("JWT_SECRET")

if ((${#missing[@]} > 0)); then
  echo "ERROR: Set these in $ENV_FILE before running:"
  printf '  - %s\n' "${missing[@]}"
  echo ""
  echo 'Tip: if display name has spaces, use quotes: RBAC_SUPER_ADMIN_DISPLAY_NAME="Your Name"'
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

echo "==> Seeding SUPER_ADMIN user for ${RBAC_SUPER_ADMIN_EMAIL}"
docker run --rm \
  --network "$NETWORK" \
  -e NODE_ENV=production \
  -e RBAC_SEED_ENABLED=true \
  -e RBAC_SEED_FORCE=true \
  -e "DATABASE_URL=postgresql://cm:${POSTGRES_PASSWORD}@postgres:5432/community_marketplace" \
  -e "JWT_SECRET=${JWT_SECRET}" \
  -e "RBAC_SUPER_ADMIN_EMAIL=${RBAC_SUPER_ADMIN_EMAIL}" \
  -e "RBAC_SUPER_ADMIN_PASSWORD=${RBAC_SUPER_ADMIN_PASSWORD}" \
  -e "RBAC_SUPER_ADMIN_DISPLAY_NAME=${RBAC_SUPER_ADMIN_DISPLAY_NAME}" \
  "$MIGRATE_IMAGE" \
  sh -c "cd apps/api && pnpm run seed:rbac"

echo "==> Done. Log in at https://${DOMAIN:-sellnearby.ie}/auth/login"
echo "    Dashboard: https://${DOMAIN:-sellnearby.ie}/super-admin/dashboard"
echo "    Keep RBAC_SEED_ENABLED=false and RBAC_SEED_FORCE=false in .env.prod for normal runs."
