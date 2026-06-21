/**
 * actions.js
 * Application layer between pages and the api/state layers. Pages call these
 * functions; they never import api.js directly. Writes use optimistic UI and,
 * when offline, are queued (de-duplicated, durable) and replayed on reconnect.
 */

import * as api from './api.js';
import * as state from './state.js';
import * as queue from './offlineQueue.js';

// Optimistic field changes per status action (server sets the timestamps).
const STATUS_PATCH = {
  photoDone: { PhotoStatus: 'Done', FoodStatus: 'Waiting', CurrentStage: 'Food' },
  photoSkip: { PhotoStatus: 'Skipped', FoodStatus: 'Waiting', CurrentStage: 'Food' },
  foodDone: { FoodStatus: 'Done', CurrentStage: 'Completed' },
  foodSkip: { FoodStatus: 'Skipped', CurrentStage: 'Completed' }
};

/** Add a group with optimistic UI; queue when offline. */
export async function addGroupAction(payload, notifyUser) {
  const temp = buildOptimisticGroup(payload);
  state.addGroupLocal(temp);
  try {
    const saved = await api.addGroup(payload);
    state.removeGroupLocal(temp.ID);
    state.upsertGroups([saved]);
    notifyUser('Group added', 'success');
  } catch (err) {
    if (isOfflineError(err)) {
      queue.enqueue({ id: temp.ID, type: 'addGroup', payload: { fields: payload, tempId: temp.ID } });
      notifyUser('Offline — group queued', 'warn');
    } else {
      state.removeGroupLocal(temp.ID);
      notifyUser(err.message || 'Could not add group', 'error');
    }
  }
}

/** Advance a group's photo/food status; queue when offline. */
export async function updateStatusAction(action, group, notifyUser) {
  const patch = STATUS_PATCH[action];
  if (!patch || !canAdvance(action, group)) {
    return; // guard against duplicate / out-of-order submissions
  }
  const prior = snapshot(group, patch);
  state.patchGroupLocal(group.ID, patch);
  try {
    const saved = await api.updateGroupStatus(action, group.ID);
    state.upsertGroups([saved]);
  } catch (err) {
    if (isOfflineError(err)) {
      queue.enqueue({ id: action + ':' + group.ID, type: 'status', payload: { action: action, groupId: group.ID } });
      notifyUser('Offline — action queued', 'warn');
    } else {
      state.patchGroupLocal(group.ID, prior);
      notifyUser(err.message || 'Action failed', 'error');
    }
  }
}

/** Raise a request for a group; queue when offline. */
export async function createRequestAction(group, notifyUser) {
  const temp = buildOptimisticRequest(group);
  state.addRequestLocal(temp);
  try {
    const saved = await api.requestGroup(group.ID);
    state.removeRequestLocal(temp.RequestID);
    state.addRequestLocal(saved);
    notifyUser('Request sent', 'success');
  } catch (err) {
    if (isOfflineError(err)) {
      queue.enqueue({ id: 'request:' + group.ID, type: 'request', payload: { groupId: group.ID, tempId: temp.RequestID } });
      notifyUser('Offline — request queued', 'warn');
    } else {
      state.removeRequestLocal(temp.RequestID);
      notifyUser(err.message || 'Could not send request', 'error');
    }
  }
}

/** Resolve a request; queue when offline. */
export async function resolveRequestAction(request, notifyUser) {
  state.removeRequestLocal(request.RequestID);
  try {
    await api.resolveRequest(request.RequestID);
    notifyUser('Request resolved', 'success');
  } catch (err) {
    if (isOfflineError(err)) {
      queue.enqueue({ id: 'resolve:' + request.RequestID, type: 'resolve', payload: { requestId: request.RequestID } });
      notifyUser('Offline — will resolve on reconnect', 'warn');
    } else {
      state.addRequestLocal(request);
      notifyUser(err.message || 'Could not resolve request', 'error');
    }
  }
}

/** Toggle photography open/closed (requires connectivity). */
export async function togglePhotographyAction(open, notifyUser) {
  return applyToggle('togglePhotography', { PhotographyOpen: open }, open, notifyUser);
}

/** Toggle food service open/closed (requires connectivity). */
export async function toggleFoodAction(open, notifyUser) {
  return applyToggle('toggleFood', { FoodOpen: open }, open, notifyUser);
}

/** Replay all queued writes. Called on reconnect and after each good sync. */
export async function flushPending(notifyUser) {
  if (queue.size() === 0) {
    return;
  }
  const drained = await queue.flush(runQueued);
  if (drained > 0 && notifyUser) {
    notifyUser(drained + ' queued action' + (drained > 1 ? 's' : '') + ' synced', 'success');
  }
}

/** Number of writes still waiting to sync. */
export function pendingCount() {
  return queue.size();
}

/** Perform one queued operation against the API and reconcile state. */
async function runQueued(op) {
  if (op.type === 'addGroup') {
    const saved = await api.addGroup(op.payload.fields);
    state.removeGroupLocal(op.payload.tempId);
    state.upsertGroups([saved]);
  } else if (op.type === 'status') {
    state.upsertGroups([await api.updateGroupStatus(op.payload.action, op.payload.groupId)]);
  } else if (op.type === 'request') {
    const saved = await api.requestGroup(op.payload.groupId);
    state.removeRequestLocal(op.payload.tempId);
    state.addRequestLocal(saved);
  } else if (op.type === 'resolve') {
    await api.resolveRequest(op.payload.requestId);
  }
}

/** Shared toggle flow: optimistic settings patch, server call, revert on fail. */
async function applyToggle(method, patch, open, notifyUser) {
  const prior = state.getSettings();
  state.setSettings(Object.assign({}, prior, patch));
  try {
    state.setSettings(await api[method](open));
  } catch (err) {
    if (prior) {
      state.setSettings(prior);
    }
    const msg = isOfflineError(err) ? 'Offline — cannot change while disconnected' : (err.message || 'Could not update setting');
    notifyUser(msg, 'error');
  }
}

/** A waiting group can be advanced; anything else is a duplicate/no-op. */
function canAdvance(action, group) {
  if (action.indexOf('photo') === 0) {
    return String(group.PhotoStatus).toLowerCase() === 'waiting';
  }
  return String(group.FoodStatus).toLowerCase() === 'waiting';
}

function isOfflineError(err) {
  return !state.isOnline() || (err && (err.code === 'NETWORK' || err.code === 'TIMEOUT'));
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
