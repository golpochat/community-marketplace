# Docker

Multi-stage Dockerfiles for all application services plus a local `docker-compose.yml` stack.

## Build individual images

```bash
# From repo root
docker build -f infra/docker/Dockerfile.api   -t cm-api .
docker build -f infra/docker/Dockerfile.web   -t cm-web .
docker build -f infra/docker/Dockerfile.admin -t cm-admin .
docker build -f infra/docker/Dockerfile.meilisearch -t cm-meilisearch .
```

## Run full stack

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## Notes

- Next.js Dockerfiles expect `output: 'standalone'` in `next.config.ts` (TODO when enabling production Docker builds)
- API Dockerfile builds shared packages before the API
- Meilisearch image extends the official `getmeili/meilisearch` image
