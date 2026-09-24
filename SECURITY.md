# Security Policy

## Reporting

Report security issues via GitHub Security Advisories (private). Do not open public issues for vulnerabilities.

## Scope

- No backend, no accounts, no cookies. Grades stay in the browser; only the URL hash holds state, so grades are never sent to any server.
- No `innerHTML`, `dangerouslySetInnerHTML` or `eval`. ESLint enforces this.
- URL parser is fuzzed (1000 hostile hash strings) and never throws.
- `npm audit --omit=dev` must show no high or critical advisories. Dependabot is on.
- `public/_headers` carries a strict CSP (Cloudflare Pages); `index.html` carries the same policy as a meta tag for GitHub Pages. Analytics is the Cloudflare beacon only.
