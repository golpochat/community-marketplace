#!/usr/bin/env bash
# migrate.sh — Run Prisma migrations against target environment
# Usage: ./infra/scripts/migrate.sh [environment]
#   environment: dev | staging | prod  (loads DATABASE_URL from env or .env)

set -euo pipefail

ENV="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Running migrations [${ENV}]"

cd "${ROOT_DIR}/apps/api"

if [[ -f ".env.${ENV}" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.${ENV}"
  set +a
elif [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

pnpm exec prisma migrate deploy
echo "==> Migrations complete"
