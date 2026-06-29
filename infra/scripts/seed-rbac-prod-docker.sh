#!/usr/bin/env bash
# Seed RBAC roles inside the production API container (roles table only).
# Required once after first deploy when RBAC_SEED_ENABLED=false.
#
# Usage (on VPS):
#   cd /opt/sellnearby
#   ./infra/scripts/seed-rbac-prod-docker.sh
#
# Optional:
#   COMPOSE_FILE=infra/docker/docker-compose.prod.yml ENV_FILE=infra/docker/.env.prod ./infra/scripts/seed-rbac-prod-docker.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/infra/docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/infra/docker/.env.prod}"

cd "$ROOT_DIR/infra/docker"

echo "==> Seeding RBAC roles in API container"
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api node <<'NODE'
const { PrismaClient } = require('./generated/prisma');

const ROLES = [
  { id: '00000000-0000-4000-8000-000000000001', code: 'SUPER_ADMIN', name: 'Super Admin' },
  { id: '00000000-0000-4000-8000-000000000002', code: 'ADMIN', name: 'Admin' },
  { id: '00000000-0000-4000-8000-000000000003', code: 'SELLER', name: 'Seller' },
  { id: '00000000-0000-4000-8000-000000000004', code: 'BUYER', name: 'Buyer' },
];

const prisma = new PrismaClient();

(async () => {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: {
        id: role.id,
        code: role.code,
        name: role.name,
        description: `System role: ${role.code}`,
        isSystem: true,
      },
      update: {
        name: role.name,
        description: `System role: ${role.code}`,
      },
    });
    console.log(`[rbac-seed] Upserted role ${role.code}`);
  }
  console.log('[rbac-seed] Roles ready — retry account activation.');
})()
  .catch((error) => {
    console.error('[rbac-seed] Failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
NODE

echo "==> Done"
