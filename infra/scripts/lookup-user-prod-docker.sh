#!/usr/bin/env bash
# Look up user role(s) on the production Postgres container.
# Usage (on VPS):
#   cd /opt/sellnearby
#   ./infra/scripts/lookup-user-prod-docker.sh sujan@sellnearby.ie
#   ./infra/scripts/lookup-user-prod-docker.sh '%sujan%'

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/docker"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

FRAGMENT="${1:-%}"
# Wrap bare emails in % for ILIKE unless caller already passed wildcards
if [[ "$FRAGMENT" != *"%"* ]]; then
  FRAGMENT="%${FRAGMENT}%"
fi

cd "$COMPOSE_DIR"

SQL="SELECT u.email, u.status, COALESCE(u.\"displayName\", '') AS display_name, r.code AS role, r.name AS role_name, u.id
FROM users u
JOIN roles r ON r.id = u.\"primaryRoleId\"
WHERE u.email ILIKE '${FRAGMENT}'
ORDER BY u.email;"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

compose exec -T postgres psql -U cm -d community_marketplace -c "$SQL"
