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
