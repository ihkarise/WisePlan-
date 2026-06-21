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

// Optimistic field changes per status action (server sets the timestamps).
const STATUS_PATCH = {
  photoDone: { PhotoStatus: 'Done', FoodStatus: 'Waiting', CurrentStage: 'Food' },
  photoSkip: { PhotoStatus: 'Skipped', FoodStatus: 'Waiting', CurrentStage: 'Food' },
  foodDone: { FoodStatus: 'Done', CurrentStage: 'Completed' },
  foodSkip: { FoodStatus: 'Skipped', CurrentStage: 'Completed' }
};

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

/**
 * Advance a group's photo/food status with optimistic UI; revert on failure.
 * @param {string} action one of STATUS_PATCH keys.
 */
export async function updateStatusAction(action, group, notifyUser) {
  const patch = STATUS_PATCH[action];
  if (!patch) {
    return;
  }
  const prior = snapshot(group, patch);
  state.patchGroupLocal(group.ID, patch);
  try {
    const saved = await api.updateGroupStatus(action, group.ID);
    state.upsertGroups([saved]);
  } catch (err) {
    state.patchGroupLocal(group.ID, prior);
    notifyUser(err.message || 'Action failed', 'error');
  }
}

/** Raise a request for a group with optimistic UI; revert on failure. */
export async function createRequestAction(group, notifyUser) {
  const temp = buildOptimisticRequest(group);
  state.addRequestLocal(temp);
  try {
    const saved = await api.requestGroup(group.ID);
    state.removeRequestLocal(temp.RequestID);
    state.addRequestLocal(saved);
    notifyUser('Request sent', 'success');
  } catch (err) {
    state.removeRequestLocal(temp.RequestID);
    notifyUser(err.message || 'Could not send request', 'error');
  }
}

/** Resolve a request, clearing it from every banner; revert on failure. */
export async function resolveRequestAction(request, notifyUser) {
  state.removeRequestLocal(request.RequestID);
  try {
    await api.resolveRequest(request.RequestID);
    notifyUser('Request resolved', 'success');
  } catch (err) {
    state.addRequestLocal(request);
    notifyUser(err.message || 'Could not resolve request', 'error');
  }
}

/** Capture the prior values of the fields a patch will overwrite. */
function snapshot(group, fields) {
  const prior = {};
  Object.keys(fields).forEach((key) => {
    prior[key] = group[key];
  });
  return prior;
}

/** Build a temporary local request so the banner appears immediately. */
function buildOptimisticRequest(group) {
  const now = new Date().toISOString();
  return {
    RequestID: 'tmp-' + now,
    GroupID: group.ID,
    RequestedBy: 'you',
    Status: 'Active',
    FoundBy: '',
    Time: now,
    GroupName: group.GroupName,
    QueueNo: group.QueueNo,
    _optimistic: true
  };
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
    PhotoStatus: 'Waiting',
    FoodStatus: 'Pending',
    CurrentStage: 'Photography',
    CurrentLocation: '',
    Notes: payload.notes || '',
    AddedBy: 'you',
    AddedTime: now,
    LastModified: now,
    _optimistic: true
  };
}
