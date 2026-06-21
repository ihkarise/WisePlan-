# Wise EventFlow — Release Report

Acceptance + deployment readiness report for the release candidate.

## Repository status

| Item | Value |
|------|-------|
| Branch | `claude/affectionate-goodall-66m6aj` |
| Head commit | `9a84823` (M6 release candidate) |
| Milestones merged | M1–M6 (6 feature/stabilization commits) |
| Backend files | 10 Apps Script `.gs` files |
| Frontend files | 27 JS modules + 3 CSS + PWA shell |
| Working tree | Clean; all changes committed and pushed |
| Outstanding code changes | None (M7 is docs + a dev alias only) |

## Apps Script version

- Runtime: **V8** (`appsscript.json`).
- Web app: **Execute as the deploying user**, **Access: Anyone**.
- Endpoints: `doGet` (`ping`, `settings`, `sync`) and `doPost`
  (`addGroup`, `photoDone`, `photoSkip`, `foodDone`, `foodSkip`, `requestGroup`,
  `resolveRequest`, `togglePhotography`, `toggleFood`).
- Deployment version: **set at deploy time** — record it here after deploying,
  e.g. `Deployment @N (YYYY-MM-DD)`.

## GitHub Pages URL

- Placeholder: `https://<github-username>.github.io/<repo>/`
- Served from the **`/docs`** folder of the deployment branch.
- Health check: `<APPS_SCRIPT_EXEC_URL>?action=ping` returns `{"pong":true,...}`.

## Google Sheet structure (six sheets, blueprint §6)

| Sheet | Columns |
|-------|---------|
| **Settings** | EventName, PhotographyOpen, FoodOpen, Announcement |
| **Groups** | ID, QueueNo, GroupName, Members, Category, SubCategory, Priority, PhotoStatus, FoodStatus, CurrentStage, CurrentLocation, Notes, AddedBy, AddedTime, PhotoTime, FoodTime, LastModified |
| **Categories** | Category, SubCategory, Active, SortOrder |
| **Requests** | RequestID, GroupID, RequestedBy, Status, FoundBy, Time |
| **Users** | UserID, Name, Role, Token, Active *(present per blueprint; not used by the shared-key auth)* |
| **ActivityLog** | Timestamp, User, Action, GroupID, Details |

Auth: a single shared **API key** stored in **Script Properties** (`API_KEY`).

## Production validation (Part 5)

| Check | Result |
|-------|--------|
| No console logs / debugger in shipped code | PASS (none) |
| No unhandled promise rejections | PASS (`fetch` wrapped; SW register `.catch`) |
| No duplicate polling / timers | PASS (single timer + `syncing` guard) |
| No duplicate submissions | PASS (queue dedup + `canAdvance` guard) |
| No JS exceptions in tests | PASS |
| No Apps Script exceptions | PASS (all routes wrapped → JSON error envelope) |
| No missing assets | PASS (SW precache matches disk; icons/css/js present) |
| No broken routes | PASS (nav routes == app ROUTES: dashboard/photo/food/requests/add) |

## Known limitations

- No server-side idempotency key — a write whose response is lost could replay
  (mitigated by client dedup + optimistic-state guards).
- Settings, announcement, and categories are edited in the Google Sheet (no
  in-app editor).
- Optimistic request banner can briefly flicker before the next sync.
- Validation here is via Node simulations + static audits; physical multi-phone
  and a live Lighthouse run are still recommended (see test docs).

## Scores

- **Production readiness: 9 / 10** — correct, stable, and resilient for one
  trusted event; gap is end-to-end idempotency + live device QA.
- **Deployment readiness: 9.5 / 10** — full from-scratch checklist, seed/clear
  helpers, and acceptance + multi-device test scripts provided; only the live
  walkthrough remains.

## Recommended release tag

**`v1.0.0-rc1`** — promote to **`v1.0.0`** after a live multi-device pass
(MULTI_DEVICE_TEST.md) and a Lighthouse run confirm the targets.
