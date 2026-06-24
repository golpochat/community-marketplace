#!/usr/bin/env bash
# rotate-secrets.sh — Rotate application secrets (JWT, DB password, R2 keys)
# Usage: ./infra/scripts/rotate-secrets.sh [namespace]
# Requires: kubectl, openssl

set -euo pipefail

NAMESPACE="${1:-community-marketplace}"

echo "==> Rotating secrets in namespace: ${NAMESPACE}"

NEW_JWT="$(openssl rand -base64 48)"
NEW_DB_PASSWORD="$(openssl rand -base64 32)"

kubectl create secret generic api-secrets-rotated \
  --namespace="${NAMESPACE}" \
  --from-literal=JWT_SECRET="${NEW_JWT}" \
  --from-literal=POSTGRES_PASSWORD="${NEW_DB_PASSWORD}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Patch api deployment to pick up rotated secrets, then restart pods:"
echo "    kubectl rollout restart deployment/api -n ${NAMESPACE}"
echo ""
echo "==> Update GitHub Actions secrets: JWT_SECRET, DATABASE_URL, PROD_DATABASE_URL"
echo "==> Re-seal secrets if using Sealed Secrets / External Secrets Operator"
