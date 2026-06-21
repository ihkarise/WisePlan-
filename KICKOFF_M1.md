# Wise EventFlow — Claude Code Kickoff (Milestone 1)

> Paste this as your first task message. The blueprint and the master
> development prompt are assumed to already be in this repo as context.

---

## Context (already in this repo — treat as binding)

- **`Wise_EventFlow_Master_Blueprint_v1.md`** — the single source of truth.
- **The master development prompt** — your role, stack, file rules, layer
  diagram, workflow, error handling, git rules, and priority order.

If anything below conflicts with the blueprint, stop and ask. One conflict
is already flagged at the bottom of this message.

---

## Resolved architecture decisions (binding — do not re-litigate)

These were decided before kickoff. Implement exactly as written.

1. **Cross-origin writes.** All writes go through one `doPost(e)`. The client
   sends `Content-Type: text/plain` with a JSON body
   `{ action, token, payload }`. `doPost` parses `e.postData.contents` and
   routes on `action`. Reads use GET query params (`?action=...&token=...`).
   Never send `application/json` on POST — it triggers a CORS preflight that
   Apps Script cannot answer, and writes will silently fail.

2. **Write concurrency.** Every write wraps `LockService.getScriptLock()` →
   `lock.waitLock(10000)` → work → `lock.releaseLock()` in a `try/finally`.
   QueueNo assignment and row appends happen inside the lock.

3. **Auth.** Token-in-URL. First load reads `?t=TOKEN`, persists it to
   localStorage, then strips it from the visible URL. Every API call sends the
   token; the backend resolves Name + Role from the `Users` sheet and rejects
   unknown or inactive tokens. No PIN screen.

4. **Offline policy.** Reads are served from the localStorage cache when
   offline (last-known group list still renders). Writes require connectivity:
   on an offline write, show a toast ("You're offline — action queued") and
   retry the single pending action on reconnect. No multi-action offline-first
   sync engine in v1.

5. **Sync.** The `sync` endpoint returns `{ version, since, changed: [...] }`:
   a version hash plus only the rows modified since the `lastSync` timestamp
   the client passes. Client polls every 5s while visible, backs off to 15s
   when `document.hidden`. Writes use optimistic UI, reconciled by the next
   sync.

Also fixed: **QueueNo is global sequential**, assigned inside the lock at
add-time. The **Requests module is a paging flow** (a request broadcasts a
RequestBanner to all volunteers; the first to resolve sets FoundBy).

---

## Milestone 1 scope — a thin vertical slice (NOT the whole app)

Goal: prove the entire stack end-to-end with **one** feature before building
nine pages. This de-risks CORS, locking, sync, and deployment first.

**Backend (Apps Script):**
- `doGet` handling only: `ping`, `settings`, `sync`.
- `doPost` handling only: `addGroup` — with the text/plain action router and
  LockService.
- A setup function (or written steps) that creates the six sheets from
  blueprint §6 with their exact headers.

**Frontend (`docs/`):**
- App shell, bottom navigation, `config.js`, `api.js`, `state.js`, `sync.js`.
- Exactly two working screens: **Dashboard** (live group list via 5s sync) and
  **Add Group**.
- PWA installable: `manifest.json` + service worker (cache-first for the shell,
  network for data).

**Deploy:**
- Steps to deploy the Apps Script web app (Anyone-can-access) and publish
  `docs/` via GitHub Pages.

**Definition of done:** I open the GitHub Pages URL on a phone, install the
PWA, add a group, and see it appear on a second phone within 5 seconds. CORS,
lock, sync, and deploy are all proven on real devices.

**Explicitly NOT in Milestone 1:** photo queue, food queue, requests, search,
stats, settings editing, dark mode, and any role beyond admin. Those are
Milestones 2–4.

---

## Before you write code (per the workflow)

1. Restate the implementation plan for **this slice only**.
2. List the exact files you will create.
3. Flag any conflict with the blueprint.

Then implement. Then summarize completed work and list what remains for
Milestone 2.

---

## Guardrails (reminder)

- Only `api.js` communicates with the backend — components never do.
- ≤ 400 lines per file, ≤ 40 lines per function. No inline CSS or JS.
  `async/await` throughout. No frameworks, no CDNs.
- One feature per commit, one feature per branch. Start on
  `feat/m1-foundation`.
- Do **not** scaffold all nine pages wide in Milestone 1.

---

## Flagged conflict (decide before starting)

This kickoff sequences the build by **vertical slice** (one feature working
end-to-end), whereas blueprint §19 sequences by **layer** (Week 1 Foundation →
Week 2 Backend → Week 3 Frontend). A thin slice proves CORS, locking, and
deployment before any volume is built, which serves the "Reliability first"
priority. If you'd rather follow §19's layer order instead, say so and I'll
re-scope Milestone 1.
