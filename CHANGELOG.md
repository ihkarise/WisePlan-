# Changelog

All notable changes to Wise EventFlow are documented here. Dates use the event
build timeline; versions follow semantic versioning.

## [1.0.0-rc1] — Release candidate

Production-ready candidate for a single live event with 5–10 volunteers.

### Added (Milestones 1–4)
- **Dashboard** with live group queue, stat cards, and debounced client-side
  search (name / category / subcategory).
- **Add Group** with dynamic category + subcategory chips (no hardcoded values).
- **Photography** and **Food** queues with Done/Skip; service OPEN/CLOSED toggles
  that pause the matching Done action.
- **Requests** paging flow: raise a request, broadcast as a fixed banner to every
  device via sync, first volunteer to resolve sets FoundBy.
- **Announcement banner** driven by the Announcement setting.
- **Dark mode**: system theme + manual toggle, persisted to localStorage.
- **Offline**: durable, de-duplicated write queue with automatic replay; cached
  reads; "Offline Mode" indicator with queued count.
- **PWA**: installable, cache-first shell, offline-capable.
- Single shared **API key** auth (no login/roles/user management).

### Changed / Fixed (Milestone 5 — stabilization)
- Batched state notifications + change detection: an idle 5s poll now causes
  **0 re-renders** (was ~4); a real change causes exactly one.
- Sync hardened against overlapping ticks (visibility/online) — no concurrent
  fetches or duplicate timers.
- `resolveRequest` is idempotent (first resolver keeps FoundBy).
- Development seed helper (`Dev.gs`): 50 mixed groups + 5 requests, disabled by
  default and unreachable over HTTP.

### Optimized (Milestone 6 — release candidate)
- Removed redundant startup settings fetch and unused code (`ping`,
  `fetchSettings`, `loadSettingsOnce`, `stopSync`, `offlineQueue.has`) and unused
  CSS (`.blocking*`, `.dashboard__add`).
- Surfaced persistent auth/config sync failures with a user-facing message
  instead of a silent "offline" state.
- Accessibility: keyboard focus-visible rings, larger touch targets (≥44px),
  higher-contrast status pill, reduced-motion support.
- PWA/SEO polish: manifest `id`/`lang`/`dir`/`categories`, mobile web-app meta
  tags, service-worker cache bumped to `wef-shell-v5`.

### Known limitations
- No server-side idempotency key: a write whose response is lost could replay
  (mitigated by client-side dedup + state guards).
- Settings/announcement are edited in the sheet (no in-app editor).
- Optimistic-request banner can briefly flicker before the next sync.
- Verified via Node simulations and static audits; on-device multi-phone and
  Lighthouse runs are recommended before tagging `v1.0.0`.
