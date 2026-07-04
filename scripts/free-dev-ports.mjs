import { freeDevPorts } from './lib/dev-process.mjs';

const ports = process.argv
  .slice(2)
  .map((value) => Number(value))
  .filter((value) => Number.isInteger(value) && value > 0);

const result = freeDevPorts({
  ports: ports.length > 0 ? ports : undefined,
  reason: 'manual dev port cleanup',
});

if (result.killed.length === 0) {
  console.log('[dev] No stale Community Marketplace dev listeners found.');
} else {
  console.log(`[dev] Cleared ${result.killed.length} stale dev process tree(s).`);
}
