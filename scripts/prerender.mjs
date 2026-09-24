import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Minimal prerender: ensure dist/index.html contains headings/intro/FAQ
// (Vite already outputs index.html; this verifies static content exists).
const dist = new URL('../dist/index.html', import.meta.url);
if (!existsSync(dist)) {
  console.error('dist/index.html not found; run vite build first');
  process.exit(1);
}
const html = await readFile(dist, 'utf8');
const needed = ['Your IB Diploma total', 'Subjects', 'How it works'];
const missing = needed.filter((s) => !html.includes(s));
if (missing.length > 0) {
  console.error(`prerender missing: ${missing.join(', ')}`);
  process.exit(1);
}
await writeFile(dist, html);
console.log('prerender ok');
