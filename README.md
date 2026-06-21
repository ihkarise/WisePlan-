# Wise EventFlow

A mobile-first Progressive Web App for coordinating volunteers during weddings
and live events. Zero server cost: **GitHub Pages + Google Apps Script + Google
Sheets**. No frameworks, no build step — vanilla HTML/CSS/JS ES modules.

> Source of truth: [`Wise_EventFlow_Master_Blueprint_v1.md`](Wise_EventFlow_Master_Blueprint_v1.md).

## Status — Milestone 1 (thin vertical slice)

A single feature proven end-to-end to de-risk CORS, write locking, 5s sync, and
deployment before the rest of the app is built.

- **Dashboard** — live group queue, refreshed every 5s (15s when backgrounded).
- **Add Group** — optimistic add with an offline queue fallback.
- **PWA** — installable, cache-first shell, offline reads from local cache.

Not in this milestone: photo/food queues, requests, search, stats, settings
editing, dark mode, and non-admin roles (Milestones 2–4).

## Architecture

```
Presentation (pages)  ->  docs/js/pages/*
Components            ->  docs/js/components/*
State                ->  docs/js/state.js   (+ actions.js orchestration)
API                  ->  docs/js/api.js     (the ONLY network module)
Apps Script          ->  apps-script/*.gs
Google Sheets        ->  six sheets (blueprint §6)
```

Components never talk to the backend. Writes POST `text/plain` with
`{ action, token, payload }` (no CORS preflight); reads use GET query params.
QueueNo is global-sequential, assigned inside a `LockService` lock at add time.

## Project layout

```
apps-script/   Google Apps Script backend (one file per concern)
docs/          The PWA, published by GitHub Pages
  css/         Design tokens, layout, components
  js/          config, api, state, sync, actions, app
    utils/     dom, storage, token helpers
    components/ header, bottomNav, groupCard, toast
    pages/     dashboard, addGroup
  assets/      PWA icons
DEPLOY.md      Step-by-step deployment + device test
```

## Get it running

See **[DEPLOY.md](DEPLOY.md)**. In short: run `setupSheets()` in Apps Script,
deploy the web app (access: Anyone), paste the `/exec` URL into
`docs/js/config.js`, enable GitHub Pages on `/docs`, then open
`…/?t=<ADMIN_TOKEN>` on a phone.

## Conventions

- ≤ 400 lines per JS file, ≤ 40 lines per function.
- `async/await` throughout; no inline CSS or JS; no frameworks or CDNs.
- One feature per commit and per branch.
