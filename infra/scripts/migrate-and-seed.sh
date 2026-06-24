#!/usr/bin/env bash
# Apply Prisma migrations then seed RBAC reference data + bootstrap SUPER_ADMIN.
#
# Usage:
#   ./infra/scripts/migrate-and-seed.sh          # development (migrate dev)
#   NODE_ENV=staging ./infra/scripts/migrate-and-seed.sh   # staging (migrate deploy)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" && "${RBAC_SEED_FORCE:-false}" != "true" ]]; then
  echo "error: migrate-and-seed is blocked in production."
  exit 1
fi

echo "==> migrate-and-seed (NODE_ENV=$NODE_ENV)"

if [[ "$NODE_ENV" == "staging" || "$NODE_ENV" == "test" ]]; then
  pnpm --filter @community-marketplace/api exec prisma migrate deploy
else
  pnpm --filter @community-marketplace/api exec prisma migrate dev
fi

./infra/scripts/seed-rbac.sh

echo "==> migrate-and-seed complete"
