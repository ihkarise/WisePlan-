/**
 * Groups.gs
 * Write paths for groups: add a group and advance its photo/food status.
 * QueueNo is global-sequential and assigned inside a script lock; every status
 * change also runs inside the lock so concurrent volunteers stay consistent.
 */

var LOCK_TIMEOUT_MS = 10000;

// Status / stage vocabulary (shared with the queue filters on the client).
var PHOTO_INITIAL = 'Waiting';   // a new group is waiting for photography
var FOOD_INITIAL = 'Pending';    // food opens only after photography is handled
var STAGE_PHOTO = 'Photography';
var STAGE_FOOD = 'Food';
var STAGE_DONE = 'Completed';

/**
 * Add a new group. @param {string} actor display name. @param {Object} payload.
 * @return {Object} the created group in client shape.
 */
function addGroup(actor, payload) {
  var groupName = (payload && payload.groupName ? String(payload.groupName) : '').trim();
  if (!groupName) {
    throw new Error('groupName is required');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.GROUPS);
    var queueNo = nextQueueNo(sheet);
    var stamp = nowIso();
    var row = buildGroupRow(newGroupId(), queueNo, groupName, payload, actor, stamp);
    sheet.appendRow(row);
    logActivity(actor, 'addGroup', row[0], 'QueueNo ' + queueNo + ' / ' + groupName);
    return serializeGroupRow(row);
  } finally {
    lock.releaseLock();
  }
}

/** Mark photography complete and move the group into the food queue. */
function photoDone(actor, payload) {
  return applyGroupUpdate(payload.groupId,
    { PhotoStatus: 'Done', PhotoTime: nowIso(), FoodStatus: 'Waiting', CurrentStage: STAGE_FOOD },
    actor, 'photoDone');
}

/** Skip photography but still advance the group to the food queue. */
function photoSkip(actor, payload) {
  return applyGroupUpdate(payload.groupId,
    { PhotoStatus: 'Skipped', PhotoTime: nowIso(), FoodStatus: 'Waiting', CurrentStage: STAGE_FOOD },
    actor, 'photoSkip');
}

/** Mark food complete and finish the group's journey. */
function foodDone(actor, payload) {
  return applyGroupUpdate(payload.groupId,
    { FoodStatus: 'Done', FoodTime: nowIso(), CurrentStage: STAGE_DONE },
    actor, 'foodDone');
}

/** Skip food and finish the group's journey. */
function foodSkip(actor, payload) {
  return applyGroupUpdate(payload.groupId,
    { FoodStatus: 'Skipped', FoodTime: nowIso(), CurrentStage: STAGE_DONE },
    actor, 'foodSkip');
}

/** Compute the next global-sequential QueueNo from the QueueNo column. */
function nextQueueNo(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 1;
  }
  var queueValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var max = 0;
  for (var i = 0; i < queueValues.length; i++) {
    var n = Number(queueValues[i][0]);
    if (!isNaN(n) && n > max) {
      max = n;
    }
  }
  return max + 1;
}

/** Build a Groups row in the exact header order from Setup.gs. */
function buildGroupRow(id, queueNo, groupName, payload, addedBy, stamp) {
  return [
    id, queueNo, groupName,
    payload.members != null ? String(payload.members) : '',
    payload.category != null ? String(payload.category) : '',
    payload.subCategory != null ? String(payload.subCategory) : '',
    payload.priority != null ? String(payload.priority) : 'Normal',
    PHOTO_INITIAL, FOOD_INITIAL, STAGE_PHOTO, '',
    payload.notes != null ? String(payload.notes) : '',
    addedBy, stamp, '', '', stamp
  ];
}

/**
 * Read one group row by ID, apply field updates (plus LastModified), and write
 * it back. All inside a script lock. Returns the updated group in client shape.
 */
function applyGroupUpdate(id, updates, actor, action) {
  if (!id) {
    throw new Error('groupId is required');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.GROUPS);
    var rowIndex = findGroupRowIndex(sheet, id);
    if (rowIndex < 0) {
      throw new Error('Group not found');
    }
    var row = sheet.getRange(rowIndex, 1, 1, GROUP_HEADERS.length).getValues()[0];
    writeUpdates(row, updates);
    sheet.getRange(rowIndex, 1, 1, GROUP_HEADERS.length).setValues([row]);
    logActivity(actor, action, id, describeUpdates(updates));
    return serializeGroupRow(row);
  } finally {
    lock.releaseLock();
  }
}

/** Find the 1-based sheet row for a group ID, or -1 when absent. */
function findGroupRowIndex(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      return i + 2;
    }
  }
  return -1;
}

/** Apply field updates to a row array by header name; always bumps LastModified. */
function writeUpdates(row, updates) {
  updates.LastModified = nowIso();
  Object.keys(updates).forEach(function (key) {
    var col = GROUP_HEADERS.indexOf(key);
    if (col >= 0) {
      row[col] = updates[key];
    }
  });
}

/** A short, sortable, collision-resistant id. */
function newGroupId() {
  return 'G' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

/** Map a Groups row array to a client object using the canonical headers. */
function serializeGroupRow(row) {
  return rowToObject(GROUP_HEADERS, row);
}

/** Compact human description of an update for the audit log. */
function describeUpdates(updates) {
  return Object.keys(updates).map(function (k) { return k + '=' + updates[k]; }).join(', ');
}
