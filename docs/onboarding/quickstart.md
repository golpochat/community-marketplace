# Developer Quickstart

Get Community Marketplace running locally in ~15 minutes.

## 1. Clone & install

```bash
git clone <repo-url> community-marketplace
cd community-marketplace
pnpm install
```

## 2. Start infrastructure

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch
```

Or use host Postgres on port `5434` (see `apps/api/.env.example`).

## 3. Configure API

```bash
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL, REDIS_URL, MEILISEARCH_HOST if needed
```

## 4. Migrate & seed

```bash
cd apps/api
pnpm prisma:migrate:deploy
pnpm run seed:rbac
```

## 5. Run apps

```bash
# From repo root
pnpm dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api/health |

## 6. Login

Use accounts from [dev-credentials.md](../dev-credentials.md).

## Optional: full Docker stack

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

## Next steps

- [Local development](./local-development.md)
- [API reference](../api/README.md)
- [Security checklist](../security/checklist.md)
