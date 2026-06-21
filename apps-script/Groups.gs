/**
 * Groups.gs
 * Write path for adding a group. QueueNo is global-sequential and assigned
 * inside a script lock so two volunteers can add at the same time safely.
 */

var GROUP_PHOTO_PENDING = 'Pending';
var GROUP_FOOD_PENDING = 'Pending';
var GROUP_START_STAGE = 'Arrival';
var LOCK_TIMEOUT_MS = 10000;

/**
 * Add a new group. Called from doPost after the user is resolved.
 * @param {Object} user   Resolved {userId, name, role}.
 * @param {Object} payload {groupName, members, category, subCategory, priority, notes}.
 * @return {Object} The created group in client shape.
 */
function addGroup(user, payload) {
  var groupName = (payload && payload.groupName ? String(payload.groupName) : '').trim();
  if (!groupName) {
    throw new Error('groupName is required');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.GROUPS);
    var queueNo = nextQueueNo(sheet);
    var id = newGroupId();
    var stamp = nowIso();
    var row = buildGroupRow(id, queueNo, groupName, payload, user.name, stamp);
    sheet.appendRow(row);
    logActivity(user.name, 'addGroup', id, 'QueueNo ' + queueNo + ' / ' + groupName);
    return serializeGroupRow(row);
  } finally {
    lock.releaseLock();
  }
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
    id,
    queueNo,
    groupName,
    payload.members != null ? String(payload.members) : '',
    payload.category != null ? String(payload.category) : '',
    payload.subCategory != null ? String(payload.subCategory) : '',
    payload.priority != null ? String(payload.priority) : 'Normal',
    GROUP_PHOTO_PENDING,
    GROUP_FOOD_PENDING,
    GROUP_START_STAGE,
    '',
    payload.notes != null ? String(payload.notes) : '',
    addedBy,
    stamp,
    '',
    '',
    stamp
  ];
}

/** A short, sortable, collision-resistant id. */
function newGroupId() {
  return 'G' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

/** Map a Groups row array to a client object using the canonical headers. */
function serializeGroupRow(row) {
  return rowToObject(GROUP_HEADERS, row);
}
