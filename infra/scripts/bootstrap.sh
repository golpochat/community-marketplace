#!/usr/bin/env bash
set -euo pipefail

# Bootstrap and operational scripts for the monorepo.
# Usage: ./infra/scripts/bootstrap.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> community-marketplace bootstrap"
echo "Root: $ROOT_DIR"

if ! command -v pnpm &> /dev/null; then
  echo "pnpm is required. Install: npm install -g pnpm"
  exit 1
fi

pnpm install
pnpm build

echo "==> bootstrap complete"
