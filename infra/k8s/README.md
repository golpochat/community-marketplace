# Infrastructure

Deployment and operations assets for Community Marketplace.

## Layout

```
infra/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── Dockerfile.admin
│   ├── Dockerfile.meilisearch
│   └── docker-compose.yml
├── traefik/
│   ├── traefik.yml
│   └── dynamic/routes.yml
├── scripts/
│   ├── bootstrap.sh
│   ├── deploy.sh
│   ├── backup.sh
│   └── restore.sh
└── k8s/
    ├── base/           # Kustomize base manifests + HPA
    └── overlays/
        ├── dev/
        └── prod/
```

## Quick start

```bash
# Local stack
./infra/scripts/deploy.sh dev

# Backup
./infra/scripts/backup.sh

# Kubernetes (dev overlay)
kubectl apply -k infra/k8s/overlays/dev
```
