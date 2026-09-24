import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Minimal prerender: ensure dist/index.html contains headings/intro/FAQ
// (Vite already outputs index.html; this verifies static content exists).
const dist = new URL('../dist/index.html', import.meta.url);
if (!existsSync(dist)) {
  console.error('dist/index.html not found; run vite build first');
  process.exit(1);
}
let html = await readFile(dist, 'utf8');
const needed = ['Your IB Diploma total', 'Subjects', 'How it works'];
const missing = needed.filter((s) => !html.includes(s));
if (missing.length > 0) {
  console.error(`prerender missing: ${missing.join(', ')}`);
  process.exit(1);
}
// Cloudflare Web Analytics beacon is hard-coded in index.html (the token is
// public by design). Assert it survives the build exactly once.
const beaconHits = html.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g) ?? [];
if (beaconHits.length !== 1 || !html.includes('519b97ca534c48e6aff6d6298a48187f')) {
  console.error('Cloudflare beacon snippet missing or duplicated in dist/index.html');
  process.exit(1);
}
console.log('beacon ok');
await writeFile(dist, html);
console.log('prerender ok');
