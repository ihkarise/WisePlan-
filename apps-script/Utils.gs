/**
 * Utils.gs
 * Shared helpers: JSON responses, sheet access, time, and logging.
 * No business logic lives here.
 */

// Canonical sheet names (must match Setup.gs and blueprint section 6).
var SHEETS = {
  SETTINGS: 'Settings',
  GROUPS: 'Groups',
  CATEGORIES: 'Categories',
  REQUESTS: 'Requests',
  USERS: 'Users',
  ACTIVITY_LOG: 'ActivityLog'
};

/**
 * Wrap any object as a JSON text response. Apps Script web apps cannot set
 * arbitrary CORS headers, so we return text/plain-friendly JSON and rely on
 * simple (non-preflighted) requests from the client.
 */
function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Standard success envelope. */
function ok(data) {
  var body = data || {};
  body.ok = true;
  return jsonOutput(body);
}

/** Standard error envelope. Never throws to the client. */
function fail(message, code) {
  return jsonOutput({ ok: false, error: message || 'Unknown error', code: code || 'ERROR' });
}

/** Return a sheet by name from the bound spreadsheet, or throw a clear error. */
function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error('Missing sheet "' + name + '". Run setupSheets() first.');
  }
  return sheet;
}

/** Current time as an ISO 8601 string (used for LastModified comparisons). */
function nowIso() {
  return new Date().toISOString();
}

/**
 * Read a sheet into an array of plain objects keyed by the header row.
 * Empty sheets (header only) return [].
 */
function readObjects(sheetName) {
  var values = getSheet(sheetName).getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    rows.push(rowToObject(headers, values[r]));
  }
  return rows;
}

/** Map a single row array to an object using the header array. */
function rowToObject(headers, row) {
  var obj = {};
  for (var c = 0; c < headers.length; c++) {
    obj[headers[c]] = row[c];
  }
  return obj;
}

/** Append an audit entry to the ActivityLog sheet. Best-effort only. */
function logActivity(user, action, groupId, details) {
  try {
    getSheet(SHEETS.ACTIVITY_LOG).appendRow([
      nowIso(), user || 'unknown', action || '', groupId || '', details || ''
    ]);
  } catch (err) {
    // Logging must never break a write; swallow and continue.
  }
}
