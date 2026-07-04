import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const DEV_LOCK_PATH = path.join(REPO_ROOT, '.dev', 'dev.lock.json');

const DEFAULT_PORTS = [3000, 4000];

const PROJECT_MARKERS = [
  'Community Marketplace',
  'community-marketplace',
  '@community-marketplace',
];

const DEV_PROCESS_MARKERS = [
  'dist/main',
  'dist\\main',
  'nest.js" start --watch',
  'nest.js start --watch',
  'next/dist/bin/next',
  'scripts/dev.mjs',
  'scripts\\dev.mjs',
  'pnpm.cjs" --parallel --filter @community-marketplace',
  'pnpm.cjs dev',
  'pnpm ^"dev^"',
  'pnpm "dev"',
];

const DEV_ROOT_MARKERS = [
  'pnpm.cjs dev',
  'pnpm ^"dev^"',
  'pnpm "dev"',
  'pnpm/bin/pnpm',
  'pnpm.mjs dev',
  '--parallel --filter @community-marketplace',
  'nest.js" start --watch',
  'nest.js start --watch',
  'scripts/dev.mjs',
  'scripts\\dev.mjs',
];

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    ...options,
  });
}

function normalizeCommandLine(commandLine) {
  return (commandLine ?? '').replace(/\\/g, '/').toLowerCase();
}

function isProjectDevProcess(commandLine) {
  const normalized = commandLine ?? '';
  const hasProject = PROJECT_MARKERS.some((marker) => normalized.includes(marker));
  const hasDev = DEV_PROCESS_MARKERS.some((marker) =>
    normalizeCommandLine(normalized).includes(normalizeCommandLine(marker)),
  );
  return hasProject && hasDev;
}

function isDevRootProcess(commandLine) {
  const normalized = normalizeCommandLine(commandLine ?? '');
  return DEV_ROOT_MARKERS.some((marker) => normalized.includes(normalizeCommandLine(marker)));
}

export function getProcessInfo(pid) {
  if (!pid || pid <= 0) return null;

  if (process.platform === 'win32') {
    try {
      const escaped = String(pid).replace(/'/g, "''");
      const output = run(
        `powershell -NoProfile -Command "$p=Get-CimInstance Win32_Process -Filter \\"ProcessId=${escaped}\\"; if($p){Write-Output ($p.ProcessId); Write-Output ($p.ParentProcessId); Write-Output ($p.CommandLine)}"`,
      );
      const lines = output.split(/\r?\n/).filter(Boolean);
      if (lines.length < 3) return null;
      return {
        pid: Number(lines[0]),
        parentPid: Number(lines[1]),
        commandLine: lines.slice(2).join('\n'),
      };
    } catch {
      return null;
    }
  }

  try {
    const output = run(`ps -p ${pid} -o pid=,ppid=,command=`);
    const match = output.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/s);
    if (!match) return null;
    return {
      pid: Number(match[1]),
      parentPid: Number(match[2]),
      commandLine: match[3].trim(),
    };
  } catch {
    return null;
  }
}

export function getListeningPids(port) {
  if (process.platform === 'win32') {
    try {
      const output = run(`netstat -ano | findstr "LISTENING" | findstr ":${port} "`);
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        const match = line.trim().match(/\s(\d+)\s*$/);
        if (match) pids.add(Number(match[1]));
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const output = run(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`);
    return output
      .split(/\r?\n/)
      .map((value) => Number(value.trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function collectProcessChain(startPid, maxDepth = 12) {
  const chain = [];
  let currentPid = startPid;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const info = getProcessInfo(currentPid);
    if (!info) break;
    chain.push(info);
    if (!info.parentPid || info.parentPid === info.pid) break;
    currentPid = info.parentPid;
  }

  return chain;
}

function findDevRootPid(chain) {
  const projectChain = chain.filter((entry) => isProjectDevProcess(entry.commandLine));
  if (projectChain.length === 0) return null;

  for (let index = projectChain.length - 1; index >= 0; index -= 1) {
    if (isDevRootProcess(projectChain[index].commandLine)) {
      return projectChain[index].pid;
    }
  }

  return projectChain[projectChain.length - 1].pid;
}

export function killProcessTree(pid, { silent = false } = {}) {
  if (!pid || pid <= 0) return false;

  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: silent ? 'ignore' : 'inherit',
      });
    } else {
      spawnSync('kill', ['-TERM', String(pid)], {
        stdio: silent ? 'ignore' : 'inherit',
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function freeDevPorts({
  ports = DEFAULT_PORTS,
  silent = false,
  reason = 'dev startup cleanup',
} = {}) {
  const killTargets = new Set();

  for (const port of ports) {
    for (const listenerPid of getListeningPids(port)) {
      const chain = collectProcessChain(listenerPid);
      const rootPid = findDevRootPid(chain);
      if (rootPid) killTargets.add(rootPid);
    }
  }

  if (killTargets.size === 0) {
    return { killed: [], reason, ports };
  }

  const killed = [];
  for (const pid of killTargets) {
    const info = getProcessInfo(pid);
    if (!info) continue;
    if (!silent) {
      console.log(`[dev] ${reason}: stopping PID ${pid} (${info.commandLine.slice(0, 100)}...)`);
    }
    if (killProcessTree(pid, { silent: true })) {
      killed.push(pid);
    }
  }

  return { killed, reason, ports };
}

export function readDevLock() {
  try {
    const raw = fs.readFileSync(DEV_LOCK_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeDevLock() {
  fs.mkdirSync(path.dirname(DEV_LOCK_PATH), { recursive: true });
  fs.writeFileSync(
    DEV_LOCK_PATH,
    JSON.stringify(
      {
        pid: process.pid,
        cwd: REPO_ROOT,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

export function clearDevLock() {
  try {
    fs.unlinkSync(DEV_LOCK_PATH);
  } catch {
    // ignore missing lock
  }
}

export function releaseStaleDevLock({ silent = false } = {}) {
  const lock = readDevLock();
  if (!lock?.pid) return null;

  const info = getProcessInfo(lock.pid);
  if (!info) {
    clearDevLock();
    return null;
  }

  const sameRepo =
    normalizeCommandLine(info.commandLine).includes(normalizeCommandLine(REPO_ROOT)) ||
    lock.cwd === REPO_ROOT;

  if (!sameRepo || !isProjectDevProcess(info.commandLine)) {
    clearDevLock();
    return null;
  }

  if (!silent) {
    console.log(`[dev] Found previous dev session (PID ${lock.pid}); stopping it...`);
  }
  killProcessTree(lock.pid, { silent: true });
  clearDevLock();
  return lock.pid;
}
