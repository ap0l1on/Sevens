import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Minimal prerender checks: both pages contain their headings/intro, and the
// Cloudflare beacon survives the build exactly once per page.
const pages = [
  { file: '../dist/index.html', needed: ['Your IB Diploma total', 'Subjects', 'How it works'] },
  {
    file: '../dist/subject.html',
    needed: ['Subject grade calculator', 'Pick a subject', 'Your marks'],
  },
];
for (const page of pages) {
  const dist = new URL(page.file, import.meta.url);
  if (!existsSync(dist)) {
    console.error(`${page.file} not found; run vite build first`);
    process.exit(1);
  }
  const html = await readFile(dist, 'utf8');
  const missing = page.needed.filter((s) => !html.includes(s));
  if (missing.length > 0) {
    console.error(`${page.file} missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  const beaconHits = html.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g) ?? [];
  if (beaconHits.length !== 1 || !html.includes('519b97ca534c48e6aff6d6298a48187f')) {
    console.error(`Cloudflare beacon snippet missing or duplicated in ${page.file}`);
    process.exit(1);
  }
  console.log(`beacon ok (${page.file})`);
}
console.log('prerender ok');
