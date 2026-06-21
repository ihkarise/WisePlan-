/**
 * state.js
 * Single source of in-app truth. Holds groups, settings, and connectivity,
 * persists a cache to localStorage for offline reads, and notifies subscribers
 * on change. Knows nothing about the network — api.js/sync.js feed it.
 */

import { CONFIG } from './config.js';
import { readJson, writeJson, readString } from './utils/storage.js';

const listeners = new Set();

const state = {
  groups: new Map(),                       // keyed by group ID
  settings: readJson(CONFIG.STORAGE.SETTINGS, null),
  lastSync: readString(CONFIG.STORAGE.LAST_SYNC, ''),
  online: navigator.onLine
};

// Hydrate the group list from the cache so the UI renders instantly offline.
hydrateGroups();

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Groups sorted by QueueNo ascending for stable display. */
export function getGroups() {
  return Array.from(state.groups.values()).sort((a, b) => num(a.QueueNo) - num(b.QueueNo));
}

export function getSettings() {
  return state.settings;
}

export function getLastSync() {
  return state.lastSync;
}

export function isOnline() {
  return state.online;
}

/** Insert or update many groups by ID, then persist and notify once. */
export function upsertGroups(groups) {
  if (!groups || groups.length === 0) {
    return;
  }
  groups.forEach((g) => {
    if (g && g.ID) {
      state.groups.set(String(g.ID), g);
    }
  });
  persistGroups();
  notify();
}

/** Optimistically add a single group (e.g. before the server confirms). */
export function addGroupLocal(group) {
  if (group && group.ID) {
    state.groups.set(String(group.ID), group);
    persistGroups();
    notify();
  }
}

/** Remove a (typically temporary/optimistic) group by ID. */
export function removeGroupLocal(id) {
  if (state.groups.delete(String(id))) {
    persistGroups();
    notify();
  }
}

export function setSettings(settings) {
  state.settings = settings;
  writeJson(CONFIG.STORAGE.SETTINGS, settings);
  notify();
}

export function setLastSync(timestamp) {
  state.lastSync = timestamp || '';
  writeJson(CONFIG.STORAGE.LAST_SYNC, state.lastSync);
}

export function setOnline(online) {
  if (state.online !== online) {
    state.online = online;
    notify();
  }
}

function hydrateGroups() {
  const cached = readJson(CONFIG.STORAGE.GROUPS, []);
  cached.forEach((g) => {
    if (g && g.ID) {
      state.groups.set(String(g.ID), g);
    }
  });
}

function persistGroups() {
  writeJson(CONFIG.STORAGE.GROUPS, getGroups());
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

function num(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
