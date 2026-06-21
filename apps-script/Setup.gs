/**
 * Setup.gs
 * One-time provisioning. Run setupSheets() once from the Apps Script editor to
 * create the six sheets (blueprint section 6), seed a default Settings row, and
 * generate the shared API key (stored in Script Properties). Safe to re-run.
 */

// Canonical Groups header order. Shared with Groups.gs serialization.
var GROUP_HEADERS = [
  'ID', 'QueueNo', 'GroupName', 'Members', 'Category', 'SubCategory', 'Priority',
  'PhotoStatus', 'FoodStatus', 'CurrentStage', 'CurrentLocation', 'Notes',
  'AddedBy', 'AddedTime', 'PhotoTime', 'FoodTime', 'LastModified'
];

// Canonical Requests header order. Shared with Requests.gs serialization.
var REQUEST_HEADERS = ['RequestID', 'GroupID', 'RequestedBy', 'Status', 'FoundBy', 'Time'];

// Canonical Settings header order. Shared with Settings.gs writes.
var SETTINGS_HEADERS = ['EventName', 'PhotographyOpen', 'FoodOpen', 'Announcement'];

var SHEET_HEADERS = {
  Settings: SETTINGS_HEADERS,
  Groups: GROUP_HEADERS,
  Categories: ['Category', 'SubCategory', 'Active', 'SortOrder'],
  Requests: REQUEST_HEADERS,
  Users: ['UserID', 'Name', 'Role', 'Token', 'Active'],
  ActivityLog: ['Timestamp', 'User', 'Action', 'GroupID', 'Details']
};

/** Provision all sheets, the default settings row, and the API key. */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    ensureSheetWithHeaders(ss, name, SHEET_HEADERS[name]);
  });
  seedSettings();
  seedCategories();
  var key = ensureApiKey();
  SpreadsheetApp.getUi().alert(
    'Setup complete.\n\nShared API key:\n' + key +
    '\n\nPaste this into docs/js/config.js as API_KEY.'
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

/** Seed the default categories and organization subcategories when empty. */
function seedCategories() {
  var sheet = getSheet(SHEETS.CATEGORIES);
  if (sheet.getLastRow() >= 2) {
    return;
  }
  var rows = [
    ['Friends', '', true, 1],
    ['Family', '', true, 2],
    ['VIP', '', true, 3],
    ['Organizations', 'IHK', true, 4],
    ['Organizations', 'Senior IHK', true, 5],
    ['Organizations', 'JCI', true, 6],
    ['Organizations', 'Sahya', true, 7],
    ['Organizations', 'Lions', true, 8],
    ['Others', '', true, 9]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Ensure a shared API key exists in Script Properties, creating one if needed.
 * Returns the key so the operator can paste it into config.js.
 */
function ensureApiKey() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty(API_KEY_PROPERTY);
  if (!key) {
    key = generateToken();
    props.setProperty(API_KEY_PROPERTY, key);
  }
  return key;
}

/** Generate a URL-safe random key. */
function generateToken() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 24);
}
