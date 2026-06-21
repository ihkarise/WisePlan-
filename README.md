# Wise EventFlow

A mobile-first Progressive Web App for coordinating volunteers during weddings
and live events. Zero server cost: **GitHub Pages + Google Apps Script + Google
Sheets**. No frameworks, no build step — vanilla HTML/CSS/JS ES modules.

> Source of truth: [`Wise_EventFlow_Master_Blueprint_v1.md`](Wise_EventFlow_Master_Blueprint_v1.md).

## Status — Milestones 1–2

- **Dashboard** — live group queue, refreshed every 5s (15s when backgrounded).
- **Add Group** — optimistic add with an offline queue fallback.
- **Photography Queue** — groups waiting for photos; **Photo Done** / **Skip**.
- **Food Queue** — groups waiting for food; **Food Done** / **Skip**.
- **Requests** — raise a request for a group; it shows as a fixed banner on every
  phone via sync; the first volunteer to **Resolve** clears it everywhere.
- **PWA** — installable, cache-first shell, offline reads from local cache.

Auth is a single shared API key in `config.js` (one trusted event, 5–10
volunteers) — no login, roles, or user management.

Not yet built: search, statistics, settings editing, and dark mode.

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
`{ action, key, payload }` (no CORS preflight); reads use GET query params with
the shared `key`. QueueNo is global-sequential and every status change runs
inside a `LockService` lock so concurrent volunteers stay consistent.

Status flow: a new group is `PhotoStatus=Waiting`; **Photo Done/Skip** sets it
`Done/Skipped` and moves the group to `FoodStatus=Waiting`; **Food Done/Skip**
completes it.

## Project layout

```
apps-script/   Google Apps Script backend (one file per concern)
docs/          The PWA, published by GitHub Pages
  css/         Design tokens, layout, components
  js/          config, api, state, sync, actions, app
    utils/     dom, storage helpers
    components/ header, bottomNav, groupCard, toast, requestBanner
    pages/     dashboard, addGroup, photoQueue, foodQueue, requests, queueView
  assets/      PWA icons
DEPLOY.md      Step-by-step deployment + device test
```

## Get it running

See **[DEPLOY.md](DEPLOY.md)**. In short: run `setupSheets()` in Apps Script,
deploy the web app (access: Anyone), paste the `/exec` URL and the shared API
key into `docs/js/config.js`, enable GitHub Pages on `/docs`, then open the
published URL on a phone.

## Conventions

- ≤ 400 lines per JS file, ≤ 40 lines per function.
- `async/await` throughout; no inline CSS or JS; no frameworks or CDNs.
- One feature per commit and per branch.
