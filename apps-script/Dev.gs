/**
 * Dev.gs
 * Development-only seed helpers. These are NOT routed through doGet/doPost, so
 * they are unreachable over HTTP in production. They also refuse to run unless
 * dev mode is explicitly enabled, so they cannot accidentally fill a live event
 * sheet. Workflow: enableDevMode() -> seedSampleData() -> ... -> disableDevMode().
 */

var DEV_MODE_PROPERTY = 'DEV_MODE';

var SEED_CATEGORIES = ['Friends', 'Family', 'VIP', 'Organizations', 'Others'];
var SEED_ORG_SUBS = ['IHK', 'Senior IHK', 'JCI', 'Sahya', 'Lions'];
var SEED_PRIORITIES = ['Normal', 'High', 'VIP'];
var SEED_PHOTO = ['Waiting', 'Done', 'Skipped'];
var SEED_FOOD = ['Pending', 'Waiting', 'Done', 'Skipped'];

/** Enable dev helpers for this script. */
function enableDevMode() {
  PropertiesService.getScriptProperties().setProperty(DEV_MODE_PROPERTY, 'true');
}

/** Disable dev helpers (call before going live). */
function disableDevMode() {
  PropertiesService.getScriptProperties().deleteProperty(DEV_MODE_PROPERTY);
}

function isDevMode() {
  return PropertiesService.getScriptProperties().getProperty(DEV_MODE_PROPERTY) === 'true';
}

/** Populate 50 mixed sample groups and 5 active requests. Dev mode only. */
function seedSampleData() {
  assertDevMode();
  var groups = buildSampleGroups(50);
  var sheet = getSheet(SHEETS.GROUPS);
  sheet.getRange(sheet.getLastRow() + 1, 1, groups.length, GROUP_HEADERS.length).setValues(groups);
  seedSampleRequests(groups, 5);
  return groups.length + ' groups + 5 requests seeded.';
}

/** Remove rows created by the seeder (IDs starting SEED-). Dev mode only. */
function clearSampleData() {
  assertDevMode();
  deleteSeedRows(getSheet(SHEETS.GROUPS), 1, 'SEED-');
  deleteSeedRows(getSheet(SHEETS.REQUESTS), 1, 'SEEDR-');
  return 'Sample data cleared.';
}

function assertDevMode() {
  if (!isDevMode()) {
    throw new Error('Seeding disabled. Run enableDevMode() first (development only).');
  }
}

/** Build n sample group rows in GROUP_HEADERS order, continuing the queue. */
function buildSampleGroups(n) {
  var startQueue = nextQueueNo(getSheet(SHEETS.GROUPS));
  var rows = [];
  for (var i = 0; i < n; i++) {
    rows.push(buildSampleRow(i, startQueue + i));
  }
  return rows;
}

function buildSampleRow(i, queueNo) {
  var category = SEED_CATEGORIES[i % SEED_CATEGORIES.length];
  var sub = category === 'Organizations' ? SEED_ORG_SUBS[i % SEED_ORG_SUBS.length] : '';
  var photo = SEED_PHOTO[i % SEED_PHOTO.length];
  var food = photo === 'Waiting' ? 'Pending' : SEED_FOOD[i % SEED_FOOD.length];
  var done = nowIso();
  return [
    'SEED-' + queueNo, queueNo, 'Sample Group ' + queueNo, (1 + (i % 6)),
    category, sub, SEED_PRIORITIES[i % SEED_PRIORITIES.length],
    photo, food, sampleStage(photo, food), '', 'Seed data',
    'Seed', done, photo === 'Waiting' ? '' : done, isFoodFinal(food) ? done : '', done
  ];
}

function sampleStage(photo, food) {
  if (isFoodFinal(food)) {
    return 'Completed';
  }
  return (photo === 'Done' || photo === 'Skipped') ? 'Food' : 'Photography';
}

function isFoodFinal(food) {
  return food === 'Done' || food === 'Skipped';
}

/** Append `count` active requests referencing the first seeded groups. */
function seedSampleRequests(groups, count) {
  var sheet = getSheet(SHEETS.REQUESTS);
  var rows = [];
  for (var i = 0; i < count && i < groups.length; i++) {
    rows.push(['SEEDR-' + (i + 1), groups[i][0], 'Seed', 'Active', '', nowIso()]);
  }
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, REQUEST_HEADERS.length).setValues(rows);
  }
}

/** Delete rows whose first column starts with a prefix (bottom-up). */
function deleteSeedRows(sheet, idCol, prefix) {
  var values = sheet.getDataRange().getValues();
  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idCol - 1]).indexOf(prefix) === 0) {
      sheet.deleteRow(r + 1);
    }
  }
}
