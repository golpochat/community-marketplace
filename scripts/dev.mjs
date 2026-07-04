import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

import {
  clearDevLock,
  freeDevPorts,
  releaseStaleDevLock,
  writeDevLock,
} from './lib/dev-process.mjs';

const isWin = process.platform === 'win32';
const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';

function runPackagesBuild() {
  const result = spawnSync(
    pnpmCmd,
    ['--filter', './packages/*', 'build'],
    { stdio: 'inherit', shell: isWin },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function prepareDevEnvironment() {
  releaseStaleDevLock();
  freeDevPorts({ reason: 'preparing fresh dev session' });
  writeDevLock();
}

function spawnDevApp(filter) {
  return spawn(
    pnpmCmd,
    ['--filter', filter, 'run', 'dev'],
    {
      stdio: 'inherit',
      shell: isWin,
      env: process.env,
    },
  );
}

function shutdown(children) {
  for (const child of children) {
    if (!child?.pid) continue;
    if (isWin) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
      });
    } else {
      child.kill('SIGTERM');
    }
  }
  clearDevLock();
}

runPackagesBuild();
prepareDevEnvironment();

const api = spawnDevApp('@community-marketplace/api');
const web = spawnDevApp('@community-marketplace/web');
const children = [api, web];

let shuttingDown = false;
function handleExit(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  shutdown(children);
  process.exit(code);
}

process.on('SIGINT', () => handleExit(0));
process.on('SIGTERM', () => handleExit(0));

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    shutdown(children.filter((entry) => entry !== child));
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}
