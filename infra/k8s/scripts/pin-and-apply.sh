#!/usr/bin/env bash
set -euo pipefail

# Resolve image digests from the local docker store (after docker push) and apply
# a throwaway Kustomize overlay so cluster workloads never pull :latest / :unpinned.
# Third-party images are pulled then pinned by digest in the same overlay.

OVERLAY=${1:?overlay path required, e.g. infra/k8s/overlays/prod}
REGISTRY=${REGISTRY:?REGISTRY is required}
IMAGE_TAG=${IMAGE_TAG:?IMAGE_TAG is required}

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
OVERLAY_PATH="$ROOT/$OVERLAY"
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

digest_ref() {
  local image=$1
  local ref
  ref=$(docker inspect --format='{{index .RepoDigests 0}}' "$image")
  if [ -z "$ref" ] || [ "$ref" = "<no value>" ]; then
    echo "No digest for $image — push or pull the image before apply" >&2
    exit 1
  fi
  echo "$ref"
}

pin_public() {
  local image=$1
  docker pull "$image" >/dev/null
  digest_ref "$image"
}

image_name() {
  echo "${1%@*}"
}

image_digest() {
  echo "${1#*@}"
}

API_REF=$(digest_ref "$REGISTRY/api:$IMAGE_TAG")
WORKER_REF=$(digest_ref "$REGISTRY/worker:$IMAGE_TAG")
WEB_REF=$(digest_ref "$REGISTRY/web:$IMAGE_TAG")
REDIS_REF=$(pin_public "redis:7-alpine")
POSTGRES_REF=$(pin_public "postgres:16-alpine")
MEILI_REF=$(pin_public "getmeili/meilisearch:v1.12")

cat > "$WORKDIR/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - $OVERLAY_PATH
images:
  - name: community-marketplace/api
    newName: $(image_name "$API_REF")
    digest: $(image_digest "$API_REF")
  - name: community-marketplace/worker
    newName: $(image_name "$WORKER_REF")
    digest: $(image_digest "$WORKER_REF")
  - name: community-marketplace/web
    newName: $(image_name "$WEB_REF")
    digest: $(image_digest "$WEB_REF")
  - name: redis
    newName: $(image_name "$REDIS_REF")
    digest: $(image_digest "$REDIS_REF")
  - name: postgres
    newName: $(image_name "$POSTGRES_REF")
    digest: $(image_digest "$POSTGRES_REF")
  - name: getmeili/meilisearch
    newName: $(image_name "$MEILI_REF")
    digest: $(image_digest "$MEILI_REF")
EOF

kubectl apply -k "$WORKDIR"
