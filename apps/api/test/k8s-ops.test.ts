import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');

function readRepo(relative: string) {
  return readFileSync(path.join(ROOT, relative), 'utf8');
}

describe('phase 5–7 operations and docs', () => {
  it('does not apply :latest app images or in-repo CHANGE_ME secrets', () => {
    const kustomization = readRepo('infra/k8s/base/kustomization.yaml');
    expect(kustomization).toMatch(/external-secrets\.yaml/);
    expect(kustomization).not.toMatch(/^\s*-\s+secrets\.yaml\s*$/m);

    for (const file of [
      'infra/k8s/base/api-deployment.yaml',
      'infra/k8s/base/web-deployment.yaml',
      'infra/k8s/base/worker-deployment.yaml',
    ]) {
      expect(readRepo(file)).not.toMatch(/:latest\b/);
      expect(readRepo(file)).toMatch(/:unpinned\b/);
    }

    expect(existsSync(path.join(ROOT, 'infra/k8s/base/admin-deployment.yaml'))).toBe(false);

    expect(readRepo('.github/workflows/deploy-prod.yml')).toMatch(/pin-and-apply\.sh/);
    expect(readRepo('.github/workflows/deploy-staging.yml')).toMatch(/pin-and-apply\.sh/);
    expect(readRepo('.github/workflows/deploy-dev.yml')).toMatch(/pin-and-apply\.sh/);
  });

  it('pins third-party cluster images by digest on apply', () => {
    const pin = readRepo('infra/k8s/scripts/pin-and-apply.sh');
    expect(pin).toMatch(/pin_public "redis:7-alpine"/);
    expect(pin).toMatch(/pin_public "postgres:16-alpine"/);
    expect(pin).toMatch(/pin_public "getmeili\/meilisearch:v1.12"/);
  });

  it('protects metrics and enables Helmet plus throttling', () => {
    const metrics = readRepo('apps/api/src/modules/metrics/metrics.controller.ts');
    expect(metrics).toMatch(/MetricsScrapeGuard/);
    expect(metrics).toMatch(/SkipThrottle/);

    const main = readRepo('apps/api/src/main.ts');
    expect(main).toMatch(/helmet\(/);

    const appModule = readRepo('apps/api/src/app.module.ts');
    expect(appModule).toMatch(/ThrottlerGuard/);
    expect(appModule).toMatch(/ThrottlerModule/);

    const prometheus = readRepo('infra/observability/prometheus.yml');
    expect(prometheus).toMatch(/credentials_file: \/etc\/prometheus\/metrics_token/);
  });

  it('README treats Redis, R2, and observability as shipped', () => {
    const readme = readRepo('README.md');
    expect(readme).toMatch(/Redis 7 \+ BullMQ/);
    expect(readme).toMatch(/Cloudflare R2/);
    expect(readme).toMatch(/Prometheus .+\/api\/metrics/);
    expect(readme).toMatch(/`MEMBER`/);
    expect(readme).toMatch(/\/account/);
    expect(readme).not.toMatch(/BullMQ integration planned/);
    expect(readme).not.toMatch(/planned for listing images/);
  });

  it('keeps unified dashboard routes for member, admin, and super-admin', () => {
    for (const file of [
      'apps/web/src/app/account/page.tsx',
      'apps/web/src/app/admin/dashboard/page.tsx',
      'apps/web/src/app/super-admin/dashboard/page.tsx',
    ]) {
      expect(existsSync(path.join(ROOT, file))).toBe(true);
    }
    expect(existsSync(path.join(ROOT, 'apps/web/src/app/buyer'))).toBe(false);
    expect(existsSync(path.join(ROOT, 'apps/web/src/app/seller'))).toBe(false);
    expect(existsSync(path.join(ROOT, 'apps/web/src/app/error.tsx'))).toBe(true);
  });

  it('exports OTLP traces, enforces CSRF, and archives Postgres WAL for PITR', () => {
    expect(readRepo('apps/api/src/libs/tracing.lib.ts')).toMatch(/OTLPTraceExporter/);
    expect(readRepo('apps/api/src/app.module.ts')).toMatch(/CsrfGuard/);
    expect(readRepo('infra/k8s/base/kustomization.yaml')).toMatch(/postgres-backup-cronjob\.yaml/);
    expect(readRepo('infra/k8s/base/postgres-statefulset.yaml')).toMatch(/archive_mode=on/);
    expect(readRepo('infra/k8s/base/postgres-statefulset.yaml')).toMatch(/wal-prune/);
    expect(readRepo('infra/k8s/base/postgres-backup-cronjob.yaml')).toMatch(/pg_basebackup/);
    expect(readRepo('infra/k8s/base/network-policy.yaml')).toMatch(/postgres-basebackup/);
    expect(readRepo('.github/workflows/codeql.yml')).toMatch(/codeql-action/);
    expect(readRepo('.github/workflows/build.yml')).toMatch(/trivy-action/);
    expect(readRepo('.github/workflows/build.yml')).toMatch(/test:coverage/);
    expect(readRepo('.github/workflows/build.yml')).toMatch(/test:e2e/);
    expect(readRepo('apps/web/.eslintrc.js')).toMatch(/no-raw-palette-classes': 'error'/);
  });
});
