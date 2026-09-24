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
// Cloudflare Web Analytics beacon: CF_BEACON_TOKEN comes from the
// repository variable of the same name (see deploy-pages workflow).
// With a token, inject it; without one, drop the whole script tag.
const token = (process.env.CF_BEACON_TOKEN ?? '').trim();
if (token) {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) {
    console.error('CF_BEACON_TOKEN has an unexpected shape; refusing to inject');
    process.exit(1);
  }
  html = html.replaceAll('%%CF_BEACON_TOKEN%%', token);
  if (html.includes('%%CF_BEACON_TOKEN%%')) {
    console.error('beacon token placeholder was not fully replaced');
    process.exit(1);
  }
  console.log('beacon injected');
} else {
  const before = html;
  html = html.replace(/<script[^>]*static\.cloudflareinsights\.com[^>]*><\/script>\s?/, '');
  if (html === before || html.includes('%%CF_BEACON_TOKEN%%')) {
    console.error('beacon tag was not fully removed for token-less build');
    process.exit(1);
  }
  console.log('beacon omitted (no token)');
}
await writeFile(dist, html);
console.log('prerender ok');
