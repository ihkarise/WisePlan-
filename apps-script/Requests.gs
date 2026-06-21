/**
 * Requests.gs
 * Paging flow: a volunteer raises a request for a group; it broadcasts to every
 * client via sync as an active banner; the first volunteer to resolve it sets
 * FoundBy. Requests are low-volume, so reads return the full active set.
 */

var REQUEST_ACTIVE = 'Active';
var REQUEST_RESOLVED = 'Resolved';

/**
 * Create a request for a group. @return the created request in client shape.
 */
function requestGroup(actor, payload) {
  var groupId = payload && payload.groupId ? String(payload.groupId) : '';
  if (!groupId) {
    throw new Error('groupId is required');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.REQUESTS);
    var row = [newRequestId(), groupId, actor, REQUEST_ACTIVE, '', nowIso()];
    sheet.appendRow(row);
    logActivity(actor, 'requestGroup', groupId, 'RequestID ' + row[0]);
    return rowToObject(REQUEST_HEADERS, row);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Resolve an active request. The first writer wins and records FoundBy.
 * @return the updated request in client shape.
 */
function resolveRequest(actor, payload) {
  var requestId = payload && payload.requestId ? String(payload.requestId) : '';
  if (!requestId) {
    throw new Error('requestId is required');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.REQUESTS);
    var rowIndex = findRequestRowIndex(sheet, requestId);
    if (rowIndex < 0) {
      throw new Error('Request not found');
    }
    var row = sheet.getRange(rowIndex, 1, 1, REQUEST_HEADERS.length).getValues()[0];
    if (String(row[3]) === REQUEST_RESOLVED) {
      return rowToObject(REQUEST_HEADERS, row); // already resolved; first writer keeps FoundBy
    }
    row[3] = REQUEST_RESOLVED;          // Status
    row[4] = actor;                     // FoundBy
    sheet.getRange(rowIndex, 1, 1, REQUEST_HEADERS.length).setValues([row]);
    logActivity(actor, 'resolveRequest', row[1], 'RequestID ' + requestId);
    return rowToObject(REQUEST_HEADERS, row);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Return active requests, each enriched with the group's name and queue number
 * for display. @param {Array} groups already-read Groups objects (to avoid a
 * second read during sync).
 */
function getActiveRequests(groups) {
  var byId = indexGroups(groups);
  var requests = readObjects(SHEETS.REQUESTS);
  var active = [];
  for (var i = 0; i < requests.length; i++) {
    if (String(requests[i].Status) === REQUEST_ACTIVE) {
      active.push(enrichRequest(requests[i], byId));
    }
  }
  return active;
}

/** Build a map of group ID -> {GroupName, QueueNo}. */
function indexGroups(groups) {
  var map = {};
  (groups || []).forEach(function (g) {
    map[String(g.ID)] = { GroupName: g.GroupName, QueueNo: g.QueueNo };
  });
  return map;
}

/** Attach the group's name and queue number to a request object. */
function enrichRequest(request, byId) {
  var info = byId[String(request.GroupID)] || {};
  request.GroupName = info.GroupName || 'Unknown group';
  request.QueueNo = info.QueueNo != null ? info.QueueNo : '';
  return request;
}

/** Find the 1-based sheet row for a request ID, or -1 when absent. */
function findRequestRowIndex(sheet, id) {
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

function newRequestId() {
  return 'R' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}
