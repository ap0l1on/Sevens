# Security Policy

## Reporting

Report security issues via GitHub Security Advisories (private). Do not open public issues for vulnerabilities.

## Scope

- No backend, no accounts, no cookies. Grades stay in the browser; only the URL holds state.
- No `innerHTML`, `dangerouslySetInnerHTML` or `eval`. ESLint enforces this.
- URL parser is fuzzed (1000 hostile query strings) and never throws.
- `npm audit --omit=dev` must show no high or critical advisories. Dependabot is on.
- Cloudflare Pages headers are in `public/_headers`, including strict CSP with Umami `gateway.umami.is`.
