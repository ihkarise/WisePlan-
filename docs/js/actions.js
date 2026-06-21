/**
 * actions.js
 * Application layer between pages and the api/state layers. Pages call these
 * functions; they never import api.js directly. Handles optimistic UI and the
 * single pending offline write (per the v1 offline policy).
 */

import * as api from './api.js';
import * as state from './state.js';

// At most one queued write in v1 — no multi-action offline sync engine.
let pendingWrite = null;

/**
 * Add a group with optimistic UI.
 * @param {Object} payload group fields from the form.
 * @param {(msg:string, kind:string)=>void} notifyUser toast callback.
 * @return {Promise<{queued:boolean}>}
 */
export async function addGroupAction(payload, notifyUser) {
  const temp = buildOptimisticGroup(payload);
  state.addGroupLocal(temp);
  try {
    const saved = await api.addGroup(payload);
    state.removeGroupLocal(temp.ID);
    state.upsertGroups([saved]);
    notifyUser('Group added', 'success');
    return { queued: false };
  } catch (err) {
    return handleWriteFailure(err, payload, temp, notifyUser);
  }
}

/** Decide whether a failed write is queued for retry or surfaced as an error. */
function handleWriteFailure(err, payload, temp, notifyUser) {
  const offline = !state.isOnline() || err.code === 'NETWORK' || err.code === 'TIMEOUT';
  if (offline) {
    pendingWrite = { type: 'addGroup', payload, tempId: temp.ID };
    notifyUser("You're offline — action queued", 'warn');
    return { queued: true };
  }
  state.removeGroupLocal(temp.ID);
  notifyUser(err.message || 'Could not add group', 'error');
  return { queued: false };
}

/** Replay the single pending write after reconnecting. Best-effort. */
export async function flushPending(notifyUser) {
  if (!pendingWrite || pendingWrite.type !== 'addGroup') {
    return;
  }
  const job = pendingWrite;
  pendingWrite = null;
  try {
    const saved = await api.addGroup(job.payload);
    state.removeGroupLocal(job.tempId);
    state.upsertGroups([saved]);
    if (notifyUser) {
      notifyUser('Queued group synced', 'success');
    }
  } catch (err) {
    pendingWrite = job; // keep it for the next reconnect attempt
  }
}

export function hasPendingWrite() {
  return pendingWrite !== null;
}

/** Build a temporary local group so the dashboard updates immediately. */
function buildOptimisticGroup(payload) {
  const now = new Date().toISOString();
  return {
    ID: 'tmp-' + now,
    QueueNo: '…',
    GroupName: payload.groupName,
    Members: payload.members || '',
    Category: payload.category || '',
    SubCategory: payload.subCategory || '',
    Priority: payload.priority || 'Normal',
    PhotoStatus: 'Pending',
    FoodStatus: 'Pending',
    CurrentStage: 'Arrival',
    CurrentLocation: '',
    Notes: payload.notes || '',
    AddedBy: 'you',
    AddedTime: now,
    LastModified: now,
    _optimistic: true
  };
}
