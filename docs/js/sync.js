/**
 * sync.js
 * Owns connectivity and the polling loop. Polls the sync endpoint every 5s
 * while visible, backs off to 15s when the tab is hidden, serves cached reads
 * when offline, and flushes the pending write on reconnect.
 */

import { CONFIG } from './config.js';
import * as api from './api.js';
import * as state from './state.js';
import { flushPending } from './actions.js';

let timerId = null;
let running = false;
let syncing = false;
let onStatus = () => {};

/**
 * Start syncing. @param {(msg,kind)=>void} notify toast callback used for
 * reconnect/queue notifications.
 */
export function startSync(notify) {
  if (running) {
    return;
  }
  running = true;
  onStatus = notify || onStatus;
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', reschedule);
  loadSettingsOnce();
  tick();
}

/** Stop syncing and detach listeners. */
export function stopSync() {
  running = false;
  clearTimeout(timerId);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  document.removeEventListener('visibilitychange', reschedule);
}

/** Run one sync cycle now, then schedule the next. */
async function tick() {
  if (!running) {
    return;
  }
  await runSyncSafe();
  schedule();
}

/** A single delta sync, with all errors contained (offline is normal). */
async function runSyncSafe() {
  if (syncing) {
    return; // a cycle is already in flight; avoid overlapping fetches
  }
  if (!navigator.onLine) {
    state.setOnline(false);
    return;
  }
  syncing = true;
  try {
    const result = await api.fetchSync(state.getLastSync());
    applyResult(result);
    await flushPending(onStatus);
  } catch (err) {
    state.setOnline(false);
  } finally {
    syncing = false;
  }
}

/** Apply a sync result as one batched update (single re-render). */
function applyResult(result) {
  state.batch(() => {
    state.upsertGroups(result.changed);
    state.setRequests(result.requests);
    if (result.settings) {
      state.setSettings(result.settings);
    }
    if (result.categories) {
      state.setCategories(result.categories);
    }
    state.setLastSync(result.serverTime);
    state.setOnline(true);
    state.setSynced(true);
  });
}

/** Fetch settings a single time at startup (cached thereafter). */
async function loadSettingsOnce() {
  try {
    const settings = await api.fetchSettings();
    state.setSettings(settings);
  } catch (err) {
    // Keep any cached settings; the dashboard still renders.
  }
}

function schedule() {
  clearTimeout(timerId);
  const interval = document.hidden ? CONFIG.SYNC_INTERVAL_HIDDEN_MS : CONFIG.SYNC_INTERVAL_MS;
  timerId = setTimeout(tick, interval);
}

/** Restart the cadence immediately when visibility changes. */
function reschedule() {
  if (running && !document.hidden) {
    tick();
  } else {
    schedule();
  }
}

async function handleOnline() {
  state.setOnline(true);
  await flushPending(onStatus);
  tick();
}

function handleOffline() {
  state.setOnline(false);
}
