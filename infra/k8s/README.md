# Infrastructure

Deployment and operations assets for Community Marketplace.

## Layout

```
infra/
├── docker/             # Compose files + Dockerfiles (api, web, worker, redis, meilisearch)
├── observability/      # Prometheus, Grafana, Loki, OTel Collector
├── traefik/            # Reverse proxy / TLS
├── scripts/            # Deploy, migrate, backup, restore
└── k8s/
    ├── base/           # Kustomize base (ExternalSecrets, digest-unpinned app images)
    ├── source-secrets/ # RBAC for cm-source-secrets (apply once per cluster)
    ├── scripts/        # pin-and-apply.sh
    └── overlays/
        ├── dev/
        ├── staging/
        └── prod/
```

## Quick start

```bash
# Local stack
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch

# Kubernetes — pin digests after docker push (app images + redis/postgres/meilisearch)
kubectl apply -k infra/k8s/source-secrets
REGISTRY=ghcr.io/<org>/community-marketplace IMAGE_TAG=dev-<sha> \
  bash infra/k8s/scripts/pin-and-apply.sh infra/k8s/overlays/dev
```

See [`docs/infrastructure/README.md`](../../docs/infrastructure/README.md) and [`docs/runbooks/deploy.md`](../../docs/runbooks/deploy.md).
