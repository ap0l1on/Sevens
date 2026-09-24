import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Minimal prerender checks: pages contain their headings, the Cloudflare
// beacon survives the build exactly once per page, and the old subject page
// redirects to the in-page calculator.
const pages = [
  {
    file: '../dist/index.html',
    needed: ['Your IB Diploma total', 'Subjects', 'Subject grade'],
  },
  {
    file: '../dist/more.html',
    needed: ['More: offers', 'Your offer', 'How it works'],
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
const redirectUrl = new URL('../dist/subject.html', import.meta.url);
if (!existsSync(redirectUrl)) {
  console.error('../dist/subject.html not found; run vite build first');
  process.exit(1);
}
const redirect = await readFile(redirectUrl, 'utf8');
if (!redirect.includes('index.html#subject')) {
  console.error('../dist/subject.html does not redirect to index.html#subject');
  process.exit(1);
}
console.log('redirect ok (../dist/subject.html)');
console.log('prerender ok');
