import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  process.exit(0);
}

for (const file of fs.readdirSync(publicDir)) {
  if (
    file === 'sw.js' ||
    file === 'sw.js.map' ||
    /^workbox-/.test(file) ||
    /^swe-worker-/.test(file) ||
    /^fallback-/.test(file)
  ) {
    fs.rmSync(path.join(publicDir, file), { force: true });
  }
}
