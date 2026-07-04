/**
 * Force NODE_ENV=development for `next dev`.
 * A global NODE_ENV=production (e.g. from Docker/CI shells) breaks CSS and RSC in dev.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { freeDevPorts } from '../../../scripts/lib/dev-process.mjs';

process.env.NODE_ENV = 'development';

freeDevPorts({
  ports: [3000],
  reason: 'preparing web dev server',
});

const nextBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../node_modules/next/dist/bin/next',
);

const result = spawnSync(process.execPath, [nextBin, 'dev', '--port', '3000'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
