/**
 * Full development seed chain: RBAC → dev users/categories → test fixtures → monetization products.
 */
import 'dotenv/config';

import { execSync } from 'node:child_process';
import path from 'node:path';

const apiRoot = path.resolve(__dirname, '..');

function run(command: string) {
  console.log(`\n[seed:all] $ ${command}`);
  execSync(command, { cwd: apiRoot, stdio: 'inherit', env: process.env });
}

async function main() {
  run('pnpm run seed:rbac');
  run('pnpm run seed:dev-users');
  run('pnpm run seed:test-data');
  run('node scripts/seed-monetization-products.mjs');
  console.log('\n[seed:all] Complete — all development and test fixtures are ready.');
}

main().catch((error) => {
  console.error('[seed:all] Failed:', error);
  process.exit(1);
});
