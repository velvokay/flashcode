# Flashcode deployment

Last updated: October 17, 2026

## Launch architecture

Flashcode ships as a static React application on Cloudflare Pages. Study data remains in browser `localStorage`; there is no API, account system, Worker, or database in the initial release.

This is intentional. A backend becomes justified only when Flashcode needs accounts, cross-device sync, shared plans, subscriptions, or server-managed access.

## Cloudflare Pages configuration

| Setting | Value |
| --- | --- |
| Repository | `velvokay/flashcode` |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | `22.12.0` or newer |
| Production domain | `flashcoder.io` |
| Canonical host | `https://flashcoder.io` |

Pull requests should receive preview deployments. Preview URLs have independent browser storage and must never be treated as production data.

## Progress

### Repository preparation

- [x] Keep the launch architecture static and backend-free.
- [x] Add versioned browser persistence while accepting the legacy `flashcode:data:v1` format.
- [x] Add JSON backup export and validated import.
- [x] State clearly that progress remains in the browser.
- [x] Add production security and cache headers in `public/_headers`.
- [x] Return a real 404 page for unknown paths instead of the application shell.
- [x] Validate imported and custom question links as HTTPS URLs.
- [x] Verify tests, production build, and the rendered settings flow.
- [x] Commit the launch foundation and merge it into `main`.

### Cloudflare setup

- [x] Create the Pages project from the GitHub repository.
- [x] Configure the production branch, build command, output directory, and Node version above.
- [x] Confirm the first `*.pages.dev` production deployment.
- [x] Attach `flashcoder.io` as the production custom domain.
- [x] Attach `www.flashcoder.io` and create a permanent redirect to `https://flashcoder.io`.
- [x] Enable Always Use HTTPS.
- [x] Verify the managed TLS certificate before considering HSTS.
- [ ] Disable public access to the `*.pages.dev` hostname if Cloudflare account options allow it; otherwise ensure it is not linked as a canonical origin.

### Production validation

- [x] Confirm `flashcoder.io` loads over HTTPS with no mixed content.
- [x] Confirm `www.flashcoder.io` redirects to the canonical host.
- [x] Confirm security headers with browser developer tools or an external header scanner.
- [ ] Complete and rate a problem, refresh, close the browser, and confirm progress remains.
- [ ] Deploy a harmless follow-up commit and confirm existing production progress remains.
- [x] Export a backup, reset in a test browser, import it, and confirm reviews, history, plans, custom questions, and the active session return.
- [ ] Confirm direct LeetCode links open correctly.
- [ ] Confirm unknown and sensitive-looking paths return the 404 page without exposing files.
- [ ] Confirm mobile, keyboard, and reduced-motion behavior.

## Security baseline

- Cloudflare Pages is the only public origin. Flashcode has no server process, API, database, authentication endpoint, or administrator route.
- The production Content Security Policy only permits same-origin scripts, styles, fonts, and connections. Framing, plugins, forms to other origins, and sensitive browser permissions are blocked.
- HTTP redirects to HTTPS, TLS 1.0 and 1.1 are rejected, and TLS 1.2 and 1.3 are accepted.
- Cloudflare's HTTP DDoS protection is always enabled. Keep its managed rules at their defaults.
- On the Free plan, the Free Managed Ruleset is deployed by default. Verify it remains enabled in **Security > Settings** after material Cloudflare configuration changes.
- Bot Fight Mode is optional for this static release. If enabled, verify the app in a private window and inspect the console because bot challenges can affect legitimate automation and strict Content Security Policies.
- Keep HSTS disabled during the initial launch period. Consider enabling it only after every production hostname has remained HTTPS-only and stable.
- Enable GitHub Dependabot alerts and secret scanning, and protect `main` so production changes continue to arrive through reviewed pull requests.

## Storage behavior

- `localhost`, `flashcoder.io`, `www.flashcoder.io`, Pages previews, and `*.pages.dev` are different browser origins and therefore have separate local storage.
- Existing localhost progress will not appear on the production domain automatically. Export it locally and import it on `flashcoder.io`.
- Deployments do not erase production progress as long as the canonical origin and storage migration path remain stable.
- Clearing browser data still removes local progress. Backups are the recovery mechanism for the static release.
- Never place passwords, API tokens, or other secrets in local storage or the client bundle.

## Deferred backend path

If cross-device sync becomes necessary, add a same-origin `/api` Worker and Cloudflare D1 together with authentication. Keep the built-in question catalog in the static bundle and sync only user-specific reviews, events, sessions, plan selection, and custom questions.

Do not add D1 or an API before an identity model and conflict-resolution strategy have been designed.
