# Wise EventFlow — Stress Test (Realistic Event Simulation)

Simulates a busy reception with high group volume and concurrent volunteer
activity, to surface race conditions before a live event.

> Load test data only in development: in Apps Script run `enableDevMode()` first,
> and `disableDevMode()` when finished.

## Setup

1. `enableDevMode()`
2. `seedLargeDataset(100)` (or `200`) → 100/200 mixed groups + 5 active requests.
3. Open the published URL on 3–4 devices.

## Continuous load script (manual)

Run these in parallel across devices for ~10 minutes:

- **Continuous Add** — Phone A keeps adding groups (one every few seconds).
- **Continuous Photo Updates** — Phone B clears the Photography queue (Done/Skip).
- **Continuous Food Updates** — Phone C clears the Food queue (Done/Skip).
- **Multiple Requests** — Coordinator raises several requests; volunteers resolve.
- **Offline / Online transitions** — Toggle Airplane mode on one phone mid-stream;
  add a group offline, then reconnect.

## What to watch

| Concern | Expected behaviour |
|---------|--------------------|
| QueueNo | Always unique and sequential — assigned inside a `LockService` lock at add time. Verified: 200 seeded + live adds stayed unique (1..204). |
| Concurrent adds | Two phones adding together get distinct numbers (lock serializes the read-modify-append). |
| Photo/Food updates | Each status change is a locked row update; last-writer-wins on the same row, but a group only advances from "Waiting" (the client guard blocks duplicates). |
| Requests | Append + resolve are locked; the first resolver sets FoundBy, later resolves are no-ops. |
| Offline adds | Queued (deduplicated), replayed on reconnect; no duplicate rows. |
| Rendering | Idle polls cause 0 re-renders; only real deltas repaint (batched state). |
| Sync volume | One in-flight sync at a time (overlap guard); 5s visible / 15s hidden. |

## Race-condition analysis

- **Add vs Add:** safe — QueueNo computed as `max(QueueNo)+1` inside the lock.
- **Status vs Status on the same group:** lock-serialized; the client's
  `canAdvance` guard prevents a second "Done" on an already-advanced group.
- **Resolve vs Resolve:** idempotent — first writer keeps FoundBy.
- **Toggle vs Toggle:** lock-serialized boolean write; last write wins (intended).
- **Sheet read window:** `sync` reads all groups once per poll; with 200+ rows
  this is well within Apps Script limits but is the main scaling cost — keep the
  sheet to a single event.

## Known scaling notes (not blockers for one event)

- `sync` returns the full active-request set and a settings snapshot each poll
  (small payloads). Group deltas are filtered by `LastModified`.
- Apps Script has a ~6 min execution limit and quota on calls; a single event
  with a handful of volunteers polling every 5s stays comfortably under quota.

## Teardown

1. `clearSeedData()` (removes only `SEED-`/`SEEDR-` rows; real entries are kept).
2. `disableDevMode()`.
