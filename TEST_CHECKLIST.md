# Wise EventFlow — Acceptance Test Checklist

Manual, step-by-step acceptance tests for a single device (multi-device is in
[MULTI_DEVICE_TEST.md](MULTI_DEVICE_TEST.md)). Run after deployment.

**Setup:** open the published URL on a phone. Optionally load test data in Apps
Script: `enableDevMode()` → `seedData()` (remove later with `clearSeedData()`).

Legend: **Steps** → what to do · **Expected** → what should happen.

---

## Dashboard
- [ ] **Loads** — Steps: open the app. Expected: header shows the event name,
      stat cards and the group list render (skeletons first, then data ≤ 5s).
- [ ] **Statistics correct** — Steps: count groups by status. Expected: cards for
      Groups / Photo Waiting / Photo Done / Food Waiting / Food Done / Requests
      match the list.
- [ ] **Announcement appears** — Steps: in the Sheet set `Settings!Announcement`
      to some text. Expected: within ~5s a banner shows it; clearing it hides the
      banner.
- [ ] **Toggles work** — Steps: tap **Photography** and **Food** toggles.
      Expected: each flips OPEN↔CLOSED immediately and persists after refresh.

## Add Group
- [ ] **Add new group** — Steps: Add tab → enter a name, pick a category chip
      (and subcategory if shown) → Add to queue. Expected: returns to Dashboard,
      the group appears immediately and gets a queue number after sync.
- [ ] **Duplicate name** — Steps: add a second group with the same name.
      Expected: it is accepted as a separate group with its own queue number
      (names are not unique by design).
- [ ] **Empty name validation** — Steps: submit with a blank name. Expected: a
      "Group name is required" toast; nothing is added.
- [ ] **Large member count** — Steps: enter members = 999. Expected: accepted and
      shown on the card without layout breakage.

## Photography
- [ ] **Mark Done** — Steps: Photo tab → a waiting group → **Photo Done**.
      Expected: it leaves the photo queue and appears in the Food queue.
- [ ] **Skip** — Steps: **Skip** on a waiting group. Expected: same movement to
      Food; card chip shows Photo: Skipped.
- [ ] **Queue updates** — Steps: watch a second action. Expected: counts and list
      update without manual refresh.

## Food
- [ ] **Mark Done** — Steps: Food tab → **Food Done**. Expected: group completes
      and leaves the food queue (Food: Done).
- [ ] **Skip** — Steps: **Skip**. Expected: completes with Food: Skipped.

## Requests
- [ ] **Create** — Steps: Requests tab → choose a group → **Send request**.
      Expected: a banner appears at the top of every screen.
- [ ] **Resolve** — Steps: tap **Resolve** on the banner/list. Expected: the
      request clears everywhere within ~5s.

## Search
- [ ] **Group Name** — Steps: type part of a name. Expected: list filters after
      ~300ms; clear (✕) restores the full list.
- [ ] **Category** — Steps: search a category (e.g. "Organizations"). Expected:
      only matching groups show.
- [ ] **SubCategory** — Steps: search a subcategory (e.g. "IHK"). Expected: only
      matching groups show; no-match shows the empty state.

## Offline
- [ ] **Disconnect internet** — Steps: enable Airplane mode. Expected: header
      shows **Offline Mode**.
- [ ] **Add Group** — Steps: add a group while offline. Expected: it appears
      optimistically and a "queued" toast shows; header shows a queued count.
- [ ] **Reconnect** — Steps: disable Airplane mode. Expected: the queue flushes
      automatically; a "synced" toast appears.
- [ ] **Sync succeeds** — Steps: check another device/refresh. Expected: the
      queued group is now persisted with a real queue number; no duplicate.

## PWA
- [ ] **Install** — Steps: Add to Home Screen. Expected: standalone icon; opens
      full-screen without browser chrome.
- [ ] **Open offline** — Steps: Airplane mode → launch from icon. Expected: the
      shell and last-cached data load.
- [ ] **Cache refresh** — Steps: bump `CACHE_VERSION`, push, reopen online.
      Expected: the new shell loads (old cache purged).
