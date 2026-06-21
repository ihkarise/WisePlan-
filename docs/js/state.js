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
  requests: new Map(),                     // keyed by RequestID (active only)
  settings: readJson(CONFIG.STORAGE.SETTINGS, null),
  categories: readJson(CONFIG.STORAGE.CATEGORIES, []),
  lastSync: readString(CONFIG.STORAGE.LAST_SYNC, ''),
  online: navigator.onLine,
  synced: false
};

// Hydrate from cache so the UI renders instantly, even offline.
hydrateGroups();
hydrateRequests();

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

/** Merge fields into one group (optimistic status change). No-op if absent. */
export function patchGroupLocal(id, fields) {
  const existing = state.groups.get(String(id));
  if (!existing) {
    return;
  }
  state.groups.set(String(id), Object.assign({}, existing, fields));
  persistGroups();
  notify();
}

/** Active requests, newest first, for the banner and requests page. */
export function getRequests() {
  return Array.from(state.requests.values())
    .sort((a, b) => String(b.Time).localeCompare(String(a.Time)));
}

/** Replace the active request set (authoritative, from sync). */
export function setRequests(requests) {
  state.requests = new Map();
  (requests || []).forEach((r) => {
    if (r && r.RequestID) {
      state.requests.set(String(r.RequestID), r);
    }
  });
  persistRequests();
  notify();
}

/** Optimistically add a single request. */
export function addRequestLocal(request) {
  if (request && request.RequestID) {
    state.requests.set(String(request.RequestID), request);
    persistRequests();
    notify();
  }
}

/** Optimistically remove a request (e.g. on resolve). */
export function removeRequestLocal(id) {
  if (state.requests.delete(String(id))) {
    persistRequests();
    notify();
  }
}

export function setSettings(settings) {
  state.settings = settings;
  writeJson(CONFIG.STORAGE.SETTINGS, settings);
  notify();
}

/** Categories for the Add Group chips. */
export function getCategories() {
  return state.categories || [];
}

export function setCategories(categories) {
  if (!Array.isArray(categories)) {
    return;
  }
  state.categories = categories;
  writeJson(CONFIG.STORAGE.CATEGORIES, categories);
  notify();
}

/** True once at least one successful sync has completed this session. */
export function hasSynced() {
  return state.synced;
}

export function setSynced(value) {
  if (state.synced !== value) {
    state.synced = value;
    notify();
  }
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

function hydrateRequests() {
  const cached = readJson(CONFIG.STORAGE.REQUESTS, []);
  cached.forEach((r) => {
    if (r && r.RequestID) {
      state.requests.set(String(r.RequestID), r);
    }
  });
}

function persistGroups() {
  writeJson(CONFIG.STORAGE.GROUPS, getGroups());
}

function persistRequests() {
  writeJson(CONFIG.STORAGE.REQUESTS, getRequests());
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

function num(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
