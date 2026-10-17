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
- [x] Verify tests, production build, and the rendered settings flow.
- [ ] Commit the launch foundation and merge it into `main`.

### Cloudflare setup

- [ ] Create the Pages project from the GitHub repository.
- [ ] Configure the production branch, build command, output directory, and Node version above.
- [ ] Confirm the first `*.pages.dev` production deployment.
- [ ] Attach `flashcoder.io` as the production custom domain.
- [ ] Attach `www.flashcoder.io` and create a permanent redirect to `https://flashcoder.io`.
- [ ] Enable Always Use HTTPS.
- [ ] Verify the managed TLS certificate before considering HSTS.
- [ ] Disable public access to the `*.pages.dev` hostname if Cloudflare account options allow it; otherwise ensure it is not linked as a canonical origin.

### Production validation

- [ ] Confirm `flashcoder.io` loads over HTTPS with no mixed content.
- [ ] Confirm `www.flashcoder.io` redirects to the canonical host.
- [ ] Confirm security headers with browser developer tools or an external header scanner.
- [ ] Complete and rate a problem, refresh, close the browser, and confirm progress remains.
- [ ] Deploy a harmless follow-up commit and confirm existing production progress remains.
- [ ] Export a backup, reset in a test browser, import it, and confirm reviews, history, plans, custom questions, and the active session return.
- [ ] Confirm direct LeetCode links open correctly.
- [ ] Confirm mobile, keyboard, and reduced-motion behavior.

## Storage behavior

- `localhost`, `flashcoder.io`, `www.flashcoder.io`, Pages previews, and `*.pages.dev` are different browser origins and therefore have separate local storage.
- Existing localhost progress will not appear on the production domain automatically. Export it locally and import it on `flashcoder.io`.
- Deployments do not erase production progress as long as the canonical origin and storage migration path remain stable.
- Clearing browser data still removes local progress. Backups are the recovery mechanism for the static release.
- Never place passwords, API tokens, or other secrets in local storage or the client bundle.

## Deferred backend path

If cross-device sync becomes necessary, add a same-origin `/api` Worker and Cloudflare D1 together with authentication. Keep the built-in question catalog in the static bundle and sync only user-specific reviews, events, sessions, plan selection, and custom questions.

Do not add D1 or an API before an identity model and conflict-resolution strategy have been designed.
