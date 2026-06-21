/**
 * Setup.gs
 * One-time provisioning. Run setupSheets() once from the Apps Script editor to
 * create the six sheets with their exact headers (blueprint section 6) and seed
 * an admin user + a default Settings row. Safe to re-run: existing sheets keep
 * their data; only missing sheets/headers/seed rows are added.
 */

// Canonical Groups header order. Shared with Groups.gs serialization.
var GROUP_HEADERS = [
  'ID', 'QueueNo', 'GroupName', 'Members', 'Category', 'SubCategory', 'Priority',
  'PhotoStatus', 'FoodStatus', 'CurrentStage', 'CurrentLocation', 'Notes',
  'AddedBy', 'AddedTime', 'PhotoTime', 'FoodTime', 'LastModified'
];

var SHEET_HEADERS = {
  Settings: ['EventName', 'PhotographyOpen', 'FoodOpen', 'Announcement'],
  Groups: GROUP_HEADERS,
  Categories: ['Category', 'SubCategory', 'Active', 'SortOrder'],
  Requests: ['RequestID', 'GroupID', 'RequestedBy', 'Status', 'FoundBy', 'Time'],
  Users: ['UserID', 'Name', 'Role', 'Token', 'Active'],
  ActivityLog: ['Timestamp', 'User', 'Action', 'GroupID', 'Details']
};

/** Provision all sheets, headers, and seed data. Run this once. */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    ensureSheetWithHeaders(ss, name, SHEET_HEADERS[name]);
  });
  seedSettings();
  var token = seedAdminUser();
  SpreadsheetApp.getUi().alert(
    'Setup complete.\n\nAdmin token: ' + token +
    '\n\nOpen the app with ?t=' + token + ' to sign in.'
  );
}

/** Create the sheet if missing and write the header row if absent. */
function ensureSheetWithHeaders(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

/** Seed one default Settings row when the sheet has no data yet. */
function seedSettings() {
  var sheet = getSheet(SHEETS.SETTINGS);
  if (sheet.getLastRow() < 2) {
    sheet.appendRow(['Wise EventFlow', true, true, '']);
  }
}

/**
 * Seed a single active Admin user with a random token when none exists.
 * Returns the admin token so the operator can build the sign-in URL.
 */
function seedAdminUser() {
  var sheet = getSheet(SHEETS.USERS);
  var existing = readObjects(SHEETS.USERS);
  if (existing.length > 0) {
    return String(existing[0].Token);
  }
  var token = generateToken();
  sheet.appendRow(['U1', 'Admin', 'Admin', token, true]);
  return token;
}

/** Generate a URL-safe random token. */
function generateToken() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 24);
}
