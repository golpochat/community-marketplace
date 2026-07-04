import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { freeDevPorts } from '../../../scripts/lib/dev-process.mjs';

const isWin = process.platform === 'win32';
const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runValidationBuild() {
  const result = spawnSync(
    pnpmCmd,
    ['--filter', '@community-marketplace/validation', 'build'],
    { stdio: 'inherit', shell: isWin, cwd: apiRoot },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPrismaGenerate() {
  const result = spawnSync(pnpmCmd, ['exec', 'prisma', 'generate'], {
    stdio: 'inherit',
    shell: isWin,
    cwd: apiRoot,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

freeDevPorts({
  ports: [4000],
  reason: 'preparing API dev server',
});

runValidationBuild();
runPrismaGenerate();

const nestBin = path.join(
  apiRoot,
  'node_modules',
  '@nestjs',
  'cli',
  'bin',
  'nest.js',
);

const child = spawn(process.execPath, [nestBin, 'start', '--watch'], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
});

function shutdown() {
  if (!child.pid) return;
  if (isWin) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: true,
    });
  } else {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
