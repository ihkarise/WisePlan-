/**
 * Settings.gs
 * Read-only access to the single Settings row (blueprint section 6).
 */

/**
 * Return the event settings as a plain object. The Settings sheet holds one
 * data row; if it is empty we return sensible defaults so the UI still renders.
 */
function getSettings() {
  var rows = readObjects(SHEETS.SETTINGS);
  if (rows.length === 0) {
    return {
      EventName: 'Wise EventFlow',
      PhotographyOpen: true,
      FoodOpen: true,
      Announcement: ''
    };
  }
  var s = rows[0];
  return {
    EventName: String(s.EventName || 'Wise EventFlow'),
    PhotographyOpen: isActive(s.PhotographyOpen),
    FoodOpen: isActive(s.FoodOpen),
    Announcement: String(s.Announcement || '')
  };
}

/** Open/close photography. @return updated settings. */
function togglePhotography(actor, payload) {
  return setServiceOpen('PhotographyOpen', payload.open, actor);
}

/** Open/close food service. @return updated settings. */
function toggleFood(actor, payload) {
  return setServiceOpen('FoodOpen', payload.open, actor);
}

/** Write a boolean Settings flag inside a lock and return fresh settings. */
function setServiceOpen(field, open, actor) {
  var col = SETTINGS_HEADERS.indexOf(field);
  if (col < 0) {
    throw new Error('Unknown setting: ' + field);
  }
  var value = (open === true || String(open) === 'true');
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    var sheet = getSheet(SHEETS.SETTINGS);
    if (sheet.getLastRow() < 2) {
      sheet.appendRow(['Wise EventFlow', true, true, '']);
    }
    sheet.getRange(2, col + 1).setValue(value);
    logActivity(actor, 'toggle', '', field + '=' + value);
    return getSettings();
  } finally {
    lock.releaseLock();
  }
}
