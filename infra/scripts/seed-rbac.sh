#!/usr/bin/env bash
# Seed RBAC roles, permissions, and bootstrap SUPER_ADMIN user.
# Safe for development and staging only (blocked in production unless RBAC_SEED_FORCE=true).
#
# Usage:
#   ./infra/scripts/seed-rbac.sh
#   NODE_ENV=staging ./infra/scripts/seed-rbac.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" && "${RBAC_SEED_FORCE:-false}" != "true" ]]; then
  echo "error: RBAC seed is blocked in production. Set RBAC_SEED_FORCE=true to override."
  exit 1
fi

echo "==> RBAC seed (NODE_ENV=$NODE_ENV)"
pnpm --filter @community-marketplace/api run seed:rbac
echo "==> RBAC seed complete"
